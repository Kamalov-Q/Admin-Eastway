export { };
declare global {
    interface Window {
        desktop: {
            version: () => Promise<string>;
            openExternal: (url: string) => Promise<void>;
        };
    }
}
