import assert from "node:assert/strict";
import {
  APPLICATION_CLOSE_AT,
  CLOSED_MESSAGE,
  CV_MAX_BYTES,
  agentId,
  applicationReference,
  digitsOnly,
  inspectCv,
  isEmail,
  limitedList,
  recruitmentWindow,
  screeningBand,
  sumScore,
  SCREENING,
  INTERVIEW,
} from "../api/_recruitmentRules.js";

const sectors = ["Education", "Healthcare", "SMEs", "Retail / E-Commerce"];

assert.equal(recruitmentWindow(Date.parse("2026-10-03T00:00:00Z")), "open");
assert.equal(recruitmentWindow(Date.parse("2026-10-02T23:59:59Z")), "before");
assert.equal(recruitmentWindow(Date.parse(APPLICATION_CLOSE_AT)), "open");
assert.equal(recruitmentWindow(Date.parse("2026-10-17T23:59:01Z")), "closed");
assert.match(CLOSED_MESSAGE, /have closed/);

assert.equal(isEmail("person@example.com"), true);
assert.equal(isEmail("not-an-email"), false);
assert.equal(digitsOnly("+231 888 636 071").length >= 7, true);
assert.equal(digitsOnly("12-34").length >= 7, false);

assert.equal(limitedList(["Education", "Healthcare"], sectors, 3).values.length, 2);
assert.equal(limitedList(["Education", "Healthcare", "SMEs", "Retail / E-Commerce"], sectors, 3).error, "Choose no more than 3.");
assert.deepEqual(limitedList(["<script>alert(1)</script>", "Education"], sectors, 3).values, ["Education"]);

const screening = sumScore({ communication: 25, network: 20, sales: 20, technology: 15, reliability: 10, integrity: 10 }, SCREENING);
assert.equal(screening.total, 100);
assert.equal(screeningBand(80), "Strong shortlist consideration");
assert.equal(screeningBand(65), "Review / possible shortlist");
assert.equal(screeningBand(50), "Hold / secondary review");
assert.equal(screeningBand(49), "Normally not shortlisted");
assert.equal(sumScore({ communication: 26, network: 0, sales: 0, technology: 0, reliability: 0, integrity: 0 }, SCREENING).error.includes("Communication"), true);

const interview = sumScore({ communication: 20, mindset: 20, prospecting: 20, judgment: 15, professionalism: 15, availability: 10 }, INTERVIEW);
assert.equal(interview.total, 100);

assert.equal(applicationReference(1), "SVL-MA-APP-2026-000001");
assert.notEqual(applicationReference(1), applicationReference(2));
assert.equal(agentId(1), "SVL-MA-0001");
assert.equal(/^SVL-MA-\d{4}$/.test(agentId(1)), true);
assert.equal(/^SVL-MA-\d{4}$/.test(applicationReference(1)), false);

const pdf = Buffer.from("%PDF-1.4 recruitment").toString("base64");
assert.equal(inspectCv({ name: "resume.pdf", type: "application/pdf", dataBase64: pdf }).ok, true);
assert.equal(Boolean(inspectCv({ name: "payload.exe", type: "application/octet-stream", dataBase64: pdf }).error), true);
assert.equal(Boolean(inspectCv({ name: "resume.pdf", type: "application/pdf", dataBase64: Buffer.alloc(CV_MAX_BYTES + 10).toString("base64") }).error), true);
assert.equal(Boolean(inspectCv({ name: "resume.pdf", type: "application/pdf", dataBase64: Buffer.from("not a pdf").toString("base64") }).error), true);

console.log("recruitment rules: 25 checks passed");
