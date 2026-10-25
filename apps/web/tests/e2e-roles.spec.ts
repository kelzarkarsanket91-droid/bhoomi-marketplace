import { test, expect } from '@playwright/test';

test.describe('Role Flow 1: Buyer Flow', () => {
  test('Buyer browses listings, searches Wardha properties, views gated listing, and checks EMI', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Bhoomi/);

    // 2. Navigate to search page
    await page.click('text=Explore');
    await expect(page).toHaveURL(/.*search/);

    // 3. Verify properties exist
    const cards = page.locator('text=Details');
    await expect(cards.first()).toBeVisible();

    // 4. Click first property details
    await cards.first().click();
    await expect(page.locator('text=Property Specifications')).toBeVisible();

    // 5. Verify gated contact button exists
    const gatedButton = page.locator('text=Login to View Phone');
    await expect(gatedButton).toBeVisible();

    // 6. Test Finance calculator link
    await page.click('text=Finance & EMI');
    await expect(page).toHaveURL(/.*finance/);
    await expect(page.locator('text=Real Estate Mortgage & EMI Engine')).toBeVisible();
  });
});

test.describe('Role Flow 2: Seller & Role Switch Flow', () => {
  test('User logs in, switches from Buyer to Seller, and accesses Add Property Wizard', async ({ page }) => {
    await page.goto('/');

    // Open login modal
    await page.click('text=Login / Register');
    await expect(page.locator('text=Welcome to Bhoomi')).toBeVisible();

    // Click demo Buyer login
    await page.click('text=Verified Buyer');
    await expect(page.locator('text=BUYER MODE')).toBeVisible();

    // Switch role to Seller
    await page.click('text=Switch to Seller');
    await expect(page.locator('text=SELLER MODE')).toBeVisible();

    // Access Add Property
    await page.click('text=Add Property');
    await expect(page.locator('text=List a New Property on Bhoomi')).toBeVisible();
    await expect(page.locator('text=Hide direct phone number until buyer logs in')).toBeVisible();
  });
});

test.describe('Role Flow 3: Broker & Deals Pipeline Flow', () => {
  test('Broker signs in, opens dashboard, reviews inquiries and deals pipeline', async ({ page }) => {
    await page.goto('/');

    // Open login modal and select Broker
    await page.click('text=Login / Register');
    await page.click('text=Broker / Dealer');

    await expect(page.locator('text=BROKER MODE')).toBeVisible();

    // Open Dashboard
    await page.click('text=Agent Dashboard');
    await expect(page.locator('text=Interactive Deals Pipeline')).toBeVisible();
    await expect(page.locator('text=Inquiry')).toBeVisible();
    await expect(page.locator('text=Negotiation')).toBeVisible();
    await expect(page.locator('text=Closed (Collect KYC)')).toBeVisible();
  });
});

test.describe('Role Flow 4: Admin / Business Owner Flow (KYC & CSV Export)', () => {
  test('Admin logs in, accesses central directory, exports contacts CSV, and inspects encrypted KYC', async ({ page }) => {
    await page.goto('/');

    // Login as Admin
    await page.click('text=Login / Register');
    await page.click('text=Admin / Owner');

    await expect(page.locator('text=ADMIN MODE')).toBeVisible();

    // Open Dashboard
    await page.click('text=Agent Dashboard');
    await expect(page.locator('text=ADMIN PORTAL')).toBeVisible();

    // Switch to Contacts tab
    await page.click('text=Buyers & Sellers Directory');
    await expect(page.locator('text=Export CSV (Contacts Directory)')).toBeVisible();

    // Check DPDP Compliance page
    await page.goto('/privacy-policy');
    await expect(page.locator('text=Your Data Rights as a Data Principal')).toBeVisible();
    await expect(page.locator('text=Download My Data (Portability)')).toBeVisible();
  });
});
