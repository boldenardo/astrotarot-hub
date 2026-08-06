import type { MetadataRoute } from "next";

const BASE_URL = "https://astrotarot.shop";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/tarot", priority: 0.9, changeFrequency: "weekly" },
    { path: "/compatibility", priority: 0.8, changeFrequency: "weekly" },
    { path: "/predictions", priority: 0.8, changeFrequency: "daily" },
    { path: "/numerology", priority: 0.8, changeFrequency: "weekly" },
    { path: "/personality", priority: 0.8, changeFrequency: "weekly" },
    { path: "/abundance", priority: 0.7, changeFrequency: "weekly" },
    { path: "/challenge", priority: 0.6, changeFrequency: "weekly" },
    { path: "/guia", priority: 0.6, changeFrequency: "monthly" },
    { path: "/quiz", priority: 0.7, changeFrequency: "monthly" },
  ];

  return publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
