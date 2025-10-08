import axiosInstance from "./axios";

export const uploadImages = async (files: File[], folder: string): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("folder", folder);

    const res = await axiosInstance.post("/upload/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });


    if (Array.isArray(res.data)) {
        return res.data
            .filter((item: any) => item?.url)
            .map((item: { url: string }) => item.url);
    }

    if (Array.isArray(res.data?.urls)) {
        return res.data.urls;
    }

    console.warn("⚠️ Unexpected image upload response format:", res.data);
    return [];
};

export const uploadThumbnail = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosInstance.post("/upload/thumbnail", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("📥 Thumbnail upload response:", res.data);

    if (typeof res.data?.url === "string") return res.data.url;
    if (typeof res.data?.data?.url === "string") return res.data.data.url;

    console.warn("⚠️ Unexpected thumbnail upload response format:", res.data);
    return "";
};
