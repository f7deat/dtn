declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'numeral';
declare module 'mockjs';
declare module 'react-fittext';

interface DetectedBarcode {
	rawValue?: string;
	format: string;
}

interface BarcodeDetector {
	detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

declare var BarcodeDetector: {
	prototype: BarcodeDetector;
	new (options?: { formats?: string[] }): BarcodeDetector;
	getSupportedFormats?: () => Promise<string[]>;
};
