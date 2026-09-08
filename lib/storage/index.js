import CloudinaryStorage from "./cloudinary";
import CloudflareStorage from "./cloudflare";

const providers = {
    cloudinary: CloudinaryStorage,
    r2: CloudflareStorage,
};

const StorageService = {
    async upload(file) {
        const providerName =
            process.env.STORAGE_PROVIDER ||
            "cloudinary";

        const Storage =
            providers[providerName];

        if (!Storage) {
            throw new Error(
                `Unsupported storage provider: ${providerName}`
            );
        }

        return Storage.upload(file);
    },

    async delete({
        provider,
        objectKey,
    }) {
        if (!provider) {
            throw new Error(
                "Storage provider is required."
            );
        }

        if (!objectKey) {
            throw new Error(
                "Storage object key is required."
            );
        }

        const Storage =
            providers[provider];

        if (!Storage) {
            throw new Error(
                `Unsupported storage provider: ${provider}`
            );
        }

        return Storage.delete(
            objectKey
        );
    },
};

export default StorageService;