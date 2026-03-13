"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("role_permissions", [

      // /dashboard  -> 1,2,3
      { role_id: 1, permission_id: 1  ,createdAt: new Date(), updatedAt: new Date() },
      { role_id: 2, permission_id: 1  ,createdAt: new Date(), updatedAt: new Date() },
      { role_id: 3, permission_id: 1  ,createdAt: new Date(), updatedAt: new Date() },

      // /assignment -> 2
      { role_id: 2, permission_id: 2  ,createdAt: new Date(), updatedAt: new Date() },

      // /driver/:driverId -> 1,3
      { role_id: 1, permission_id: 3  ,createdAt: new Date(), updatedAt: new Date() },
      { role_id: 3, permission_id: 3  ,createdAt: new Date(), updatedAt: new Date() },

      // /mission -> 1,2
      { role_id: 1, permission_id: 4  ,createdAt: new Date(), updatedAt: new Date() },
      { role_id: 2, permission_id: 4  ,createdAt: new Date(), updatedAt: new Date() },

      // /request -> 1
      { role_id: 1, permission_id: 5  ,createdAt: new Date(), updatedAt: new Date() },

      // /request/new-request -> 1,2
      { role_id: 1, permission_id: 6  ,createdAt: new Date(), updatedAt: new Date() },
      { role_id: 2, permission_id: 6  ,createdAt: new Date(), updatedAt: new Date() },

      // /request/view-request/:id -> 1,2
      { role_id: 1, permission_id: 7  ,createdAt: new Date(), updatedAt: new Date() },
      { role_id: 2, permission_id: 7  ,createdAt: new Date(), updatedAt: new Date() },

      // /mission/view-request/:id -> 1,2
      { role_id: 1, permission_id: 8 ,createdAt: new Date(), updatedAt: new Date()  },
      { role_id: 2, permission_id: 8 ,createdAt: new Date(), updatedAt: new Date()  },

      // /schedule -> 1,3
      { role_id: 1, permission_id: 9 ,createdAt: new Date(), updatedAt: new Date()  },
      { role_id: 3, permission_id: 9  ,createdAt: new Date(), updatedAt: new Date() },

      // /schedule/create-leave -> 1,3
      { role_id: 1, permission_id: 10 ,createdAt: new Date(), updatedAt: new Date()  },
      { role_id: 3, permission_id: 10 ,createdAt: new Date(), updatedAt: new Date()  },

      // /settings -> 1
      { role_id: 1, permission_id: 11 ,createdAt: new Date(), updatedAt: new Date()  },

      // /settings/add-users -> 1
      { role_id: 1, permission_id: 12 ,createdAt: new Date(), updatedAt: new Date()  },

      // /settings/vehicle-management -> 1
      { role_id: 1, permission_id: 13  ,createdAt: new Date(), updatedAt: new Date() },

      // /settings/driver-management -> 1
      { role_id: 1, permission_id: 14  ,createdAt: new Date(), updatedAt: new Date() },

      // /settings/session-management -> 1
      { role_id: 1, permission_id: 15  ,createdAt: new Date(), updatedAt: new Date() },

    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("role_permissions", null, {});
  },
};