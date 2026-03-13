const generateUsernameFromEmail = (email) => {
  if (!email) throw new Error("Email is required");

  let username = email.split("@")[0];

  username = username.replace(/[^a-zA-Z0-9._]/g, "");

  return username;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const ROUTE_STATUS = {
  PENDING: 1,
  VEHICLE_ASSIGNED: 2,
  VEHICLE_REASSIGNED: 3,
  FACULTY_APPROVED: 4,
  DRIVER_ASSIGNED: 5,
  DRIVER_REASSIGNED: 6,
  STARTED: 7,
  COMPLETED: 8,
  CANCELLED: 9,
};

const DRIVER_STATUS = {
  AVAILABLE: 1,
  ASSIGNED: 2,
  ON_TRIP: 3,
  ON_LEAVE: 4,
};

const LEAVE_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
};

const LEAVE_TYPE = {
  Sick: 1,
  Casual: 2,
  Emergency: 3,
  Other: 4,
};

module.exports = {
  generateUsernameFromEmail,
  generateOTP,
  ROUTE_STATUS,
  DRIVER_STATUS,
  LEAVE_STATUS,
  LEAVE_TYPE,
};
