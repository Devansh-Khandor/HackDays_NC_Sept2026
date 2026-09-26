import { test, expect } from "@playwright/test";
test("demo report → clarify → approve → persisted dashboard → status update", async ({
  page,
  request,
}) => {
  const reportTitle = `QA fountain leak ${Date.now()}`;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "See it. Report it. Fix it." }),
  ).toBeVisible();
  const before = await (await request.get("/api/incidents")).json();
  await page.getByRole("button", { name: "Try Demo", exact: true }).click();
  await page.getByRole("button", { name: "Explore demo scenario" }).click();
  await expect(
    page.getByRole("heading", { name: "Here's what we found." }),
  ).toBeVisible();
  await page
    .getByLabel("Your answer")
    .fill("Engineering Building II, second floor near room 2201.");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(
    page.getByRole("heading", { name: "Your photo. A clear plan." }),
  ).toBeVisible();
  expect((await (await request.get("/api/incidents")).json()).length).toBe(
    before.length,
  );
  await page.getByRole("button", { name: "Edit report", exact: true }).click();
  await page.getByLabel("Issue title").fill(reportTitle);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("button", { name: "Submit Report", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Issue Reported", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Track Report", exact: true }).click();
  await expect(page.getByRole("heading", { name: reportTitle })).toBeVisible();
  await page.waitForURL(/\/incidents\/[a-f0-9-]+$/);
  const detailUrl = page.url();
  await page.reload();
  await expect(page.getByRole("heading", { name: reportTitle })).toBeVisible();
  await page.goto("/admin");
  await page
    .getByRole("button", {
      name: reportTitle,
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("Acknowledged", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close incident details" }).click();
  await page.getByLabel("Search reports").fill(reportTitle);
  await expect(page.getByRole("row")).toHaveCount(2);
  await page.goto(detailUrl);
  await expect(
    page.locator(".detail-heading").getByText("Acknowledged", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("missing key and invalid upload produce friendly errors", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Upload issue photo")
    .setInputFiles({
      name: "qa.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(page.getByAltText("Preview of your campus issue")).toBeVisible();
  await page
    .getByLabel("What did you notice?")
    .fill("A leaking fountain in the hallway.");
  await page.getByRole("button", { name: "Analyze with Gemini" }).click();
  await expect(page.locator(".error-message")).toContainText(
    "Gemini API key is not configured",
  );
  const bad = await request.post("/api/analyze", {
    multipart: {
      mode: "live",
      image: {
        name: "fake.png",
        mimeType: "image/png",
        buffer: Buffer.from("not an image"),
      },
    },
  });
  expect(bad.status()).toBe(400);
  const unapproved = await request.post("/api/incidents", {
    data: { userApproved: false },
  });
  expect(unapproved.status()).toBe(400);
});
test("mobile layout and emergency scenario", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Try Demo", exact: true }).click();
  await page.getByRole("button", { name: "Broken electrical outlet" }).click();
  await page.getByRole("button", { name: "Explore demo scenario" }).click();
  await expect(
    page.getByText("Potential Emergency", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".safety-banner")).toContainText(
    "CampusFix is not an emergency service",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-emergency.png",
    fullPage: true,
  });
});
test("screenshots of home and operations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.goto("/admin");
  await expect(
    page.getByRole("button", { name: "Elevator 2 not operating", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
});

test("duplicate confirmation adds support without creating a report", async ({
  page,
  request,
}) => {
  const initial = await (await request.get("/api/incidents")).json();
  const wifi = initial.find(
    (i: { analysis: { category: string }; seeded: boolean }) =>
      i.analysis.category === "network" && i.seeded,
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Try Demo", exact: true }).click();
  await page.getByRole("button", { name: "Wi-Fi outage", exact: true }).click();
  await page.locator(".location-input summary").click();
  await page
    .getByLabel("building", { exact: true })
    .fill("Engineering Building II");
  await page.getByLabel("floor", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Explore demo scenario" }).click();
  await expect(
    page.getByText("This may already have been reported", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit Report", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Yes, I'm seeing this too", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "You helped make it count." }),
  ).toBeVisible();
  const final = await (await request.get("/api/incidents")).json();
  expect(final.length).toBe(initial.length);
  expect(
    final.find((i: { id: string }) => i.id === wifi.id).confirmations,
  ).toBe(wifi.confirmations + 1);
});
