import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/profile",
          "/cart",
          "/auth/",
          "/quiz/thank-you",
        ],
      },
    ],
    sitemap: "https://astrotarot.shop/sitemap.xml",
  };
}
