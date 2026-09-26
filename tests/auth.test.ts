import {describe,it,expect} from "vitest";
import {isCampusEmail,roleForUser,safeNextPath} from "@/lib/auth/policy";
describe("campus access",()=>{
 it("only accepts the exact campus domain",()=>{
  expect(isCampusEmail("Student@NCSU.EDU")).toBe(true);
  for(const email of ["a@ncsu.edu.evil.com","a@sub.ncsu.edu","a@gmail.com","a@@ncsu.edu"])expect(isCampusEmail(email)).toBe(false);
 });
 it("requires verification and reserves admin for the exact account",()=>{
  expect(roleForUser({email:"dkhando@ncsu.edu"})).toBe(null);
  expect(roleForUser({email:"dkhando@ncsu.edu",email_confirmed_at:"2026-09-26"})).toBe("admin");
  expect(roleForUser({email:"student@ncsu.edu",email_confirmed_at:"2026-09-26"})).toBe("student");
  expect(roleForUser({email:"dkhando@gmail.com",email_confirmed_at:"2026-09-26"})).toBe(null);
 });
 it("rejects external redirect destinations",()=>{
  for(const path of ["https://evil.com","//evil.com","/\\evil.com","/auth/confirm","/login"])expect(safeNextPath(path)).toBe("/");
  expect(safeNextPath("/my-reports")).toBe("/my-reports");
 });
});
