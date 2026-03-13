"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("permissions", [
      { name: "Dashboard", path: "/dashboard", is_active: true, createdAt: now, updatedAt: now },
      { name: "Assignment", path: "/assignment", is_active: true, createdAt: now, updatedAt: now },
      { name: "Driver Dashboard", path: "/driver/:driverId", is_active: true, createdAt: now, updatedAt: now },
      { name: "Mission", path: "/mission", is_active: true, createdAt: now, updatedAt: now },

      { name: "Request", path: "/request", is_active: true, createdAt: now, updatedAt: now },
      { name: "Create Request", path: "/request/new-request", is_active: true, createdAt: now, updatedAt: now },
      { name: "View Request", path: "/request/view-request/:id", is_active: true, createdAt: now, updatedAt: now },
      { name: "View Mission", path: "/mission/view-request/:id", is_active: true, createdAt: now, updatedAt: now },

      { name: "Schedule", path: "/schedule", is_active: true, createdAt: now, updatedAt: now },
      { name: "Create Leave", path: "/schedule/create-leave", is_active: true, createdAt: now, updatedAt: now },

      { name: "Settings", path: "/settings", is_active: true, createdAt: now, updatedAt: now },
      { name: "Add Users", path: "/settings/add-users", is_active: true, createdAt: now, updatedAt: now },
      { name: "Vehicle Management", path: "/settings/vehicle-management", is_active: true, createdAt: now, updatedAt: now },
      { name: "Driver Management", path: "/settings/driver-management", is_active: true, createdAt: now, updatedAt: now },
      { name: "Session Management", path: "/settings/session-management", is_active: true, createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("permissions", null, {});
  },
};