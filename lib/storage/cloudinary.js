import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CloudinaryStorage = {
    async upload(file) {
        if (!file) {
            throw new Error("File is required.");
        }

        const buffer = Buffer.from(
            await file.arrayBuffer()
        );

        return new Promise((resolve, reject) => {
            const uploadStream =
                cloudinary.uploader.upload_stream(
                    {
                        folder: "offlix/products",
                        resource_type: "image",
                    },
                    (error, result) => {
                        if (error) {
                            return reject(error);
                        }

                        if (!result) {
                            return reject(
                                new Error(
                                    "Cloudinary upload returned no result."
                                )
                            );
                        }

                        resolve({
                            provider: "cloudinary",
                            objectKey: result.public_id,
                            url: result.secure_url,
                        });
                    }
                );

            uploadStream.end(buffer);
        });
    },

    async delete(objectKey) {
        if (!objectKey) {
            throw new Error("Object key is required.");
        }

        await cloudinary.uploader.destroy(objectKey, {
            resource_type: "image",
        });

        return true;
    },
};

export default CloudinaryStorage;