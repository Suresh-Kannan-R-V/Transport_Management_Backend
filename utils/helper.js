const generateUsernameFromEmail = (email) => {
  if (!email) throw new Error("Email is required");

  let username = email.split("@")[0];

  username = username.replace(/[^a-zA-Z0-9._]/g, "");

  return username;
};

module.exports = generateUsernameFromEmail;
