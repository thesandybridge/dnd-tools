import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export async function GET(request, {params}) {
    const { z, x, y } = params;
    const fileName = `${y}`;  // Assuming that `y` includes the filename without extension

    // Define the command to get an object
    const command = new GetObjectCommand({
        Bucket: 'dndeberron',  // Your S3 Bucket
        Key: `eberron/${z}/${x}/${fileName}`  // Construct the S3 object key
    });

    try {
        const { Body } = await s3Client.send(command);

        // Create a response and set the content type based on your file type, assumed to be 'image/png'
        return new Response(Body, {
            status: 200,
            headers: {
                'Content-Type': 'image/png'
            }
        });
    } catch (error) {
        console.error('Error fetching tile:', error);
        console.log(`Z: ${z}, X: ${x}, Y: ${y}`);

        // Return a JSON response with an error message if fetching fails
        return new Response(JSON.stringify({ error: 'Failed to fetch tile', details: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
