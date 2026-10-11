import assert from "node:assert/strict";
import { test } from "node:test";
import { employeeHome, isEmployeeRole, EMPLOYEE_ROLES } from "@/lib/workspace";

test("employeeHome routes each employee role to an authorized workspace", () => {
  assert.equal(employeeHome("ADMIN"), "/admin");
  assert.equal(employeeHome("OPS_MANAGER"), "/admin");
  // DISPATCHER must not go to /admin: the admin guard only admits ADMIN/OPS_MANAGER,
  // so /admin would bounce a dispatcher straight back out. The ops guard admits them.
  assert.equal(employeeHome("DISPATCHER"), "/ops");
  assert.equal(employeeHome("COURIER"), "/courier");
});

test("employeeHome keeps customers (CLIENT) and unknown roles on the public site", () => {
  assert.equal(employeeHome("CLIENT"), "/");
  assert.equal(employeeHome("WHATEVER"), "/");
  assert.equal(employeeHome(""), "/");
});

test("isEmployeeRole excludes CLIENT and unknowns", () => {
  for (const role of EMPLOYEE_ROLES) assert.equal(isEmployeeRole(role), true);
  assert.equal(isEmployeeRole("CLIENT"), false);
  assert.equal(isEmployeeRole("GUEST"), false);
});
