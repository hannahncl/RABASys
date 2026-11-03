const db = require("../config/db");

let ensurePromise;

function ensurePaymentCheckoutTable() {
    if (!ensurePromise) {
        ensurePromise = (async () => {
            await db.query(`
                CREATE TABLE IF NOT EXISTS payment_checkout (
                    session_id VARCHAR(150) PRIMARY KEY,
                    account_id INTEGER NOT NULL,
                    booking_reference VARCHAR(100) NOT NULL,
                    payload JSONB NOT NULL,
                    package_id INTEGER NULL,
                    guests_count INTEGER NULL,
                    expires_at TIMESTAMPTZ NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    finalized_at TIMESTAMP NULL,
                    released_at TIMESTAMP NULL
                )
            `);
            await db.query(`
                ALTER TABLE payment_checkout
                    ADD COLUMN IF NOT EXISTS package_id INTEGER NULL,
                    ADD COLUMN IF NOT EXISTS guests_count INTEGER NULL,
                    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL,
                    ADD COLUMN IF NOT EXISTS released_at TIMESTAMP NULL
            `);
            await db.query(`CREATE INDEX IF NOT EXISTS idx_payment_checkout_active_package_hold
                ON payment_checkout (package_id, expires_at)
                WHERE finalized_at IS NULL AND released_at IS NULL`);
        })().catch((error) => {
            ensurePromise = null;
            throw error;
        });
    }
    return ensurePromise;
}

module.exports = { ensurePaymentCheckoutTable };
