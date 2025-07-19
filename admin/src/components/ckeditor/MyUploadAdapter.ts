import { apiUploadFile } from "@/services/file";

class MyUploadAdapter {
    constructor(loader: any) {
        // @ts-ignore
        this.loader = loader;
    }

    upload() {
        // Implement your image upload logic here
        // You can use axios, fetch, or any other library to upload the image
        
        // @ts-ignore
        return this.loader.file
            .then((file: any) => new Promise( ( resolve ) => {
                console.log(file)
                const formData = new FormData();
                formData.append('file', file);
                apiUploadFile(formData).then((v: any) => resolve( {
                    default: v.url
                } ))
            }));
    }

    abort() {
        // Implement abort logic if necessary
    }
}

export function MyCustomUploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
        return new MyUploadAdapter(loader);
    };
}