import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const CloudflareStorage = {
    async upload(file) {
        if (!file) {
            throw new Error("File is required.");
        }

        const buffer = Buffer.from(
            await file.arrayBuffer()
        );

        const objectKey = `offlix/products/${crypto.randomUUID()}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: objectKey,
                Body: buffer,
                ContentType: file.type,
            })
        );

        const url =
            `${process.env.R2_PUBLIC_URL}/${objectKey}`;

        return {
            provider: "r2",
            objectKey,
            url,
        };
    },

    async delete(objectKey) {
        if (!objectKey) {
            throw new Error("Object key is required.");
        }

        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: objectKey,
            })
        );

        return true;
    },
};

export default CloudflareStorage;