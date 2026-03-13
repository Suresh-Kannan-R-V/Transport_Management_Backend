const Tesseract = require("tesseract.js");
const axios = require("axios");
const stringSimilarity = require("string-similarity");

exports.extractLicenseData = async (req, res) => {
  try {
    const driverName = req.body.driver_name;

    if (!req.files || !req.files.license_front || !req.files.license_back) {
      return res.status(400).json({
        message: "Front and back license images required",
      });
    }

    const frontBuffer = req.files.license_front[0].buffer;
    const backBuffer = req.files.license_back[0].buffer;

    const frontOCR = await Tesseract.recognize(frontBuffer, "eng+tam");
    const backOCR = await Tesseract.recognize(backBuffer, "eng+tam");

    const extractedText = frontOCR.data.text + "\n" + backOCR.data.text;

    let licenseNumber = null;

    const dlRegex = /TN\s?\d{2}\s?\d{11}/i;
    const dlMatch = extractedText.match(dlRegex);

    if (dlMatch) {
      licenseNumber = dlMatch[0].replace(/\s/g, "");
    }

    let fallbackVehicleCode = null;

    const vehicleMatches = extractedText.match(
      /\b(MCWG|LMV|LMV-TR|TRANS|CNEQP)\b/g,
    );

    if (vehicleMatches && vehicleMatches.length) {
      fallbackVehicleCode = vehicleMatches[vehicleMatches.length - 1];
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Extract structured data from Tamil Nadu driving licence OCR.",
          },
          {
            role: "user",
            content: `
Extract:

name
address
validity_date
vehicle_code

Vehicle code rules:
Look at the vehicle table.
Take the LAST row from "Class of Vehicle".

Example values:
MCWG
LMV
LMV-TR
TRANS
CNEQP

Return JSON:

{
"name":"",
"address":"",
"validity_date":"",
"vehicle_code":""
}

OCR TEXT:
${extractedText}
`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const modelOutput = response.data.choices[0].message.content;

    // console.log("MODEL OUTPUT:", modelOutput);

    let parsed = {};

    try {
      const cleaned = modelOutput
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.log("JSON parse failed:", err.message);
    }

    const name = parsed.name;
    const address = parsed.address;
    const validity_date = parsed.validity_date;

    let vehicleCode = parsed.vehicle_code || fallbackVehicleCode;

    let licenseValid = false;

    if (validity_date) {
      const parts = validity_date.split("-");

      if (parts.length === 3) {
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        const expiry = new Date(formattedDate);

        licenseValid = expiry > new Date();
      }
    }

    // -------- NAME MATCH --------
    let nameMatch = false;

    if (driverName && name) {
      const similarity = stringSimilarity.compareTwoStrings(
        driverName.toLowerCase(),
        name.toLowerCase(),
      );

      nameMatch = similarity >= 0.8;
    }

    res.json({
      license_number: licenseNumber,
      extracted_name: name,
      extracted_address: address,
      validity_date,
      vehicle_code: vehicleCode,
      license_valid: licenseValid,
      name_match: nameMatch,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "License extraction failed",
      error: error.message,
    });
  }
};
