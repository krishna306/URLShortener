const express = require("express");
const prisma = require("../lib/prisma");
const publisher = require("../lib/redisPublisher");
const router = express.Router();

router.get("/", async (req, res) => {
  const urls = await prisma.url.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(urls);
});
router.get("/:code", async (req, res) => {
  const url = await prisma.url.findUnique({
    where: { shortCode: req.params.code },
  });
  if (!url) {
    return res.status(404).json({ error: "Not found" });
  }
  const pending = Number((await publisher.get(`clicks:${req.params.code}`)) || 0);
  res.json({ ...url, clickCount: url.clickCount + pending });
});
router.post("/", async (req, res) => {
  const { longUrl, customCode } = req.body;
  if (!longUrl) {
    return res.status(400).json({ error: "longUrl is required" });
  }
  if (customCode) {
    try {
      const newUrl = await prisma.url.create({
        data: { longUrl, shortCode: customCode },
      });
      return res.status(201).json(newUrl);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "customCode already exists" });
      }
      throw error;
    }
  }
  const { generateShortCode } = require("../lib/shortCode");

  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = generateShortCode();
    try {
      const newUrl = await prisma.url.create({
        data: { longUrl, shortCode },
      });
      return res.status(201).json(newUrl);
    } catch (error) {
      if (error.code !== "P2002") {
        throw error;
      }
    }
  }
  return res
    .status(500)
    .json({ error: "Could not generate a unique short code" });
});

module.exports = router;
