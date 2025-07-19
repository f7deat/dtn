import { CKEditor } from '@ckeditor/ckeditor5-react';
import './my-ckeditor.css';

import {
    ClassicEditor,
    Autoformat,
    AutoImage,
    BlockQuote,
    Bold,
    Heading,
    ImageBlock,
    ImageCaption,
    ImageInline,
    ImageInsertViaUrl,
    ImageResize,
    ImageStyle,
    ImageTextAlternative,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link,
    LinkImage,
    List,
    ListProperties,
    Paragraph,
    SelectAll,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextTransformation,
    Underline,
    Undo,
    EditorConfig,
    Editor,
    Alignment,
    Code,
    FontSize,
    FontColor,
    FontBackgroundColor,
    FontFamily,
    MediaEmbed
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { ProForm, ProFormItemProps } from '@ant-design/pro-components';
import { useEffect, useRef, useState } from 'react';
import { MyCustomUploadAdapterPlugin } from './MyUploadAdapter';

const MyCkEditor: React.FC<ProFormItemProps> = (props) => {
    const editorContainerRef = useRef(null);
    const [editorRef, setEditorRef] = useState<Editor>();
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const formRef = ProForm.useFormInstance();

    useEffect(() => {
        setIsLayoutReady(true);
        return () => setIsLayoutReady(false);
    }, []);

    useEffect(() => {
        const value = formRef.getFieldValue(props.name);
        editorRef?.setData(value || '');
    }, [formRef.getFieldValue(props.name)]);

    const editorConfig: EditorConfig = {
        toolbar: {
            items: [
                'undo',
                'redo',
                '|',
                'heading',
                '|',
                'bold',
                'italic',
                'underline',
                '|',
                'link',
                'insertTable',
                'blockQuote',
                '|',
                'bulletedList',
                'numberedList',
                'outdent',
                'indent',
                'imageUpload',
                'mediaEmbed',
                'alignment',
                'code',
                'blockQuote',
                'fontSize',
                'fontColor',
                'fontBackgroundColor',
                'fontFamily'
            ],
            shouldNotGroupWhenFull: false
        },
        extraPlugins: [MyCustomUploadAdapterPlugin],
        plugins: [
            Autoformat,
            AutoImage,
            BlockQuote,
            Bold,
            Heading,
            ImageBlock,
            ImageCaption,
            ImageInline,
            ImageInsertViaUrl,
            ImageResize,
            ImageStyle,
            ImageTextAlternative,
            ImageToolbar,
            ImageUpload,
            Indent,
            IndentBlock,
            Italic,
            Link,
            LinkImage,
            List,
            ListProperties,
            Paragraph,
            SelectAll,
            Table,
            TableCaption,
            TableCellProperties,
            TableColumnResize,
            TableProperties,
            TableToolbar,
            TextTransformation,
            Underline,
            Undo,
            Alignment,
            Code,
            FontSize,
            FontColor,
            FontBackgroundColor,
            FontFamily,
            MediaEmbed
        ],
        heading: {
            options: [
                {
                    model: 'paragraph',
                    title: 'Paragraph',
                    class: 'ck-heading_paragraph'
                },
                {
                    model: 'heading1',
                    view: 'h1',
                    title: 'Heading 1',
                    class: 'ck-heading_heading1'
                },
                {
                    model: 'heading2',
                    view: 'h2',
                    title: 'Heading 2',
                    class: 'ck-heading_heading2'
                },
                {
                    model: 'heading3',
                    view: 'h3',
                    title: 'Heading 3',
                    class: 'ck-heading_heading3'
                },
                {
                    model: 'heading4',
                    view: 'h4',
                    title: 'Heading 4',
                    class: 'ck-heading_heading4'
                },
                {
                    model: 'heading5',
                    view: 'h5',
                    title: 'Heading 5',
                    class: 'ck-heading_heading5'
                },
                {
                    model: 'heading6',
                    view: 'h6',
                    title: 'Heading 6',
                    class: 'ck-heading_heading6'
                }
            ]
        },
        image: {
            toolbar: [
                'toggleImageCaption',
                'imageTextAlternative',
                '|',
                'imageStyle:inline',
                'imageStyle:wrapText',
                'imageStyle:breakText',
                '|',
                'resizeImage'
            ]
        },
        initialData: formRef.getFieldValue(props.name),
        link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
            decorators: {
                toggleDownloadable: {
                    mode: 'manual',
                    label: 'Downloadable',
                    attributes: {
                        download: 'file'
                    }
                }
            }
        },
        list: {
            properties: {
                styles: true,
                startIndex: true,
                reversed: true
            }
        },
        placeholder: 'Type or paste your content here!',
        table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
        },
    };

    return (
        <ProForm.Item {...props}>
            <div>
                <div className="main-container">
                    <div className="editor-container editor-container_classic-editor" ref={editorContainerRef}>
                        <div className="editor-container__editor">
                            <div>{isLayoutReady && <CKEditor editor={ClassicEditor} config={editorConfig}
                                onReady={(editor) => {
                                    setEditorRef(editor);
                                }}
                                onChange={(_, editor) => {
                                    formRef.setFieldValue(props.name, editor.getData());
                                }} />}</div>
                        </div>
                    </div>
                </div>
            </div>
        </ProForm.Item>
    )
}

export default MyCkEditor;