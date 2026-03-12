import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://portaal.yielder.nl";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/login",
        disallow: [
          "/dashboard",
          "/tickets",
          "/hardware",
          "/software",
          "/contracten",
          "/supportcontracten",
          "/upgrade",
          "/it-gezondheid",
          "/prestaties",
          "/facturen",
          "/documenten",
          "/contact",
          "/shop",
          "/admin",
          "/auth",
          "/api",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
