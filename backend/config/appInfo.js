/**
 * Centralized application/company info used in generated documents.
 *
 * Why: Hardcoded company fields make deployments brittle and error-prone.
 * Fix: Read from env with safe defaults (no business logic change).
 */
const appInfo = {
  companyName: process.env.COMPANY_NAME || 'Distribution Fruits & Légumes',
  companyAddressLine1: process.env.COMPANY_ADDRESS_LINE1 || '123 Rue des Fruits',
  companyAddressLine2: process.env.COMPANY_ADDRESS_LINE2 || '75000 Paris, France',
};

module.exports = { appInfo };

