import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export async function GET(_, { params }) {
  const { z, x, y } = params;
  const fileName = `${y}`;

  const command = new GetObjectCommand({
    Bucket: 'dndeberron',
    Key: `eberron/${z}/${x}/${fileName}`
  });

  try {
    const { Body } = await s3Client.send(command);

    return new Response(Body, {
      status: 200,
      headers: {
        'Content-Type': 'image/png'
      }
    });
  } catch (error) {
    console.error('Error fetching tile:', error);
    console.log(`Z: ${z}, X: ${x}, Y: ${y}`);

    return new Response(JSON.stringify({
      error: 'Failed to fetch tile', details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
