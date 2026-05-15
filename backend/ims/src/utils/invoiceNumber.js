const env = require("../config/env");

const buildInvoiceNumber = (year, seq) => {
  const padded = String(seq).padStart(env.invoiceDigits, "0");
  return `${env.invoicePrefix}-${year}-${padded}`;
};

module.exports = { buildInvoiceNumber };
