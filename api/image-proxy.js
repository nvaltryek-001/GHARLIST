export default async function handler(
  req,
  res
) {
  try {
    if (req.method !== "GET") {
      res.status(405).send(
        "Method not allowed"
      );
      return;
    }

    const rawUrl =
      req.query?.url;

    if (!rawUrl) {
      res.status(400).send(
        "Missing image URL"
      );
      return;
    }

    const target =
      new URL(rawUrl);

    /*
      Security:
      only allow the exact DMart
      CDN hostname used by GHARLIST.
    */
    if (
      target.hostname !==
      "cdn.dmart.in"
    ) {
      res.status(403).send(
        "Image host not allowed"
      );
      return;
    }

    const response =
      await fetch(
        target.toString(),
        {
          headers: {
            Accept:
              "image/avif,image/webp,image/jpeg,image/png,*/*"
          }
        }
      );

    if (!response.ok) {
      res.status(
        response.status
      ).send(
        "Upstream image unavailable"
      );
      return;
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) ||
      "image/jpeg";

    const buffer =
      Buffer.from(
        await response.arrayBuffer()
      );

    res.setHeader(
      "Content-Type",
      contentType
    );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=604800"
    );

    res.status(200).send(
      buffer
    );

  } catch (error) {
    console.error(
      "GHARLIST image proxy:",
      error
    );

    res.status(500).send(
      "Image proxy failed"
    );
  }
}