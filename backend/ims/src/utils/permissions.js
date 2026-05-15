const ROLES = {
  ADMIN: "admin",
  STAFF: "staff"
};

const STAFF_PERMISSIONS = {
  SALES_BILLING: [
    "products.read",
    "sales.create",
    "sales.read",
    "sales.invoice",
    "customers.read",
    "customers.write"
  ]
};

module.exports = {
  ROLES,
  STAFF_PERMISSIONS
};
