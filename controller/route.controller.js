const { Route, RouteStop } = require("../models");

exports.createRoute = async (req, res) => {
  try {
    const { name, stops } = req.body;

    const route = await Route.create({
      name,
      created_by: req.user.id
    });

    if (stops && stops.length > 0) {
      const formattedStops = stops.map(stop => ({
        ...stop,
        route_id: route.id
      }));

      await RouteStop.bulkCreate(formattedStops);
    }

    res.status(201).json({
      msg: "Route created successfully",
      data: route
    });
  } catch (err) {
    res.status(500).json({ msg: "Route creation failed" });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;

    await Route.update(
      {
        ...req.body,
        updated_by: req.user.id
      },
      { where: { id } }
    );

    res.json({ msg: "Route updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};
