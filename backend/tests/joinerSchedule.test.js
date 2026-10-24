const { test } = require("node:test");
const assert = require("node:assert/strict");
const { earliestBookingDeadline, isJoinerDeadlineValid } = require("../utils/joinerSchedule");

test("three days before departure is the latest valid booking deadline", () => {
    assert.equal(earliestBookingDeadline("2026-10-30"), "2026-10-27");
    assert.equal(isJoinerDeadlineValid("2026-10-30", "2026-10-27"), true);
    assert.equal(isJoinerDeadlineValid("2026-10-30", "2026-10-26"), true);
    assert.equal(isJoinerDeadlineValid("2026-10-30", "2026-10-28"), false);
});

test("deadline calculation handles month, year, and leap-day boundaries", () => {
    assert.equal(earliestBookingDeadline("2027-01-02"), "2026-12-30");
    assert.equal(earliestBookingDeadline("2024-03-01"), "2024-02-27");
});

test("invalid departure dates do not pass deadline validation", () => {
    assert.equal(earliestBookingDeadline("2026-02-30"), "");
    assert.equal(isJoinerDeadlineValid("not-a-date", "2026-10-01"), false);
    assert.equal(isJoinerDeadlineValid("2026-10-30", "2026-02-30"), false);
});
