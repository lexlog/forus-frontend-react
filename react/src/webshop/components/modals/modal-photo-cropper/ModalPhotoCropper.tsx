import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModalState } from '../../../../dashboard/modules/modals/context/ModalContext';
import usePushDanger from '../../../../dashboard/hooks/usePushDanger';
import { cover } from '../../../../dashboard/components/elements/image_cropper/helpers/image';
import PdfPreview from '../../../../dashboard/components/elements/pdf-preview/PdfPreview';
import { uniqueId } from 'lodash';
import ModalPhotoCropperControl from './elements/ModalPhotoCropperControl';
import { clickOnKeyEnter } from '../../../../dashboard/helpers/wcag';

export type ModalPhotoCropperFile = {
    uid?: string;
    file?: File;
    loaded?: boolean;
    is_pdf?: boolean;
    is_image?: boolean;
    size?: { width: number; height: number; key?: string };
    originalRatio?: number;
    originalPhoto?: string;
    file_preview?: File;
    cropped_photo?: Blob;
};

export default function ModalPhotoCropper({
    modal,
    files,
    accept,
    onSubmit,
}: {
    modal: ModalState;
    files: Array<File>;
    accept?: Array<string>;
    onSubmit: (files: Array<{ file: File; file_preview: File }>) => void;
}) {
    const pushDanger = usePushDanger();

    const replaceInputRef = useRef(null);
    const [pdfTypes] = useState(['application/pdf']);
    const [fileIndex, setFileIndex] = useState(0);
    const [imageTypes] = useState(['image/jpg', 'image/jpeg', 'image/png']);
    const [cropperFiles, setCropperFiles] = useState<Array<ModalPhotoCropperFile>>([]);

    const fileIsPdf = useCallback((file: File) => pdfTypes.includes(file.type), [pdfTypes]);
    const fileIsImage = useCallback((file: File) => imageTypes.includes(file.type), [imageTypes]);

    const loaded = useMemo(() => {
        return cropperFiles.filter((file) => file.is_image && !file.loaded).length === 0;
    }, [cropperFiles]);

    const onImageLoadDone = (file: ModalPhotoCropperFile, image: Blob) => {
        setCropperFiles((files) => {
            if (files.includes(file)) {
                files[files.indexOf(file)].loaded = true;
                files[files.indexOf(file)].cropped_photo = image;
            }

            return [...files];
        });
    };

    const blobToFile = useCallback((blob: Blob, file: File) => {
        return new File([blob], file.name, { type: blob.type, lastModified: Date.now() });
    }, []);

    const makeImage = useCallback((file: File): Promise<HTMLImageElement> => {
        const createObjectURL = (file: File) => {
            return (window.URL || window.webkitURL).createObjectURL(file);
        };

        return new Promise((resolve, reject) => {
            const imageObj = new Image();

            imageObj.onload = () => setTimeout(() => resolve(imageObj), 100);
            imageObj.onerror = (e) => reject(e);
            imageObj.src = createObjectURL(file);
        });
    }, []);

    const prepareFile = useCallback(
        (file: File): Promise<ModalPhotoCropperFile> => {
            return new Promise((resolve, reject) => {
                if (!fileIsImage(file)) {
                    return resolve({
                        file,
                        uid: uniqueId('cropper_media_'),
                        is_image: false,
                        is_pdf: fileIsPdf(file),
                    });
                }

                makeImage(file)
                    .then((image) =>
                        resolve({
                            file,
                            uid: uniqueId('cropper_media_'),
                            size: { width: Math.min(image.width, 2000), height: Math.min(image.height, 2000) },
                            originalRatio: image.width / image.height,
                            originalPhoto: image.src,
                            is_image: true,
                            is_pdf: fileIsPdf(file),
                        }),
                    )
                    .catch(reject);
            });
        },
        [fileIsImage, fileIsPdf, makeImage],
    );

    const rotateImage = useCallback(
        (file: File, imageType = 'image/jpg', degrees = 0): Promise<Blob> => {
            return new Promise((resolve, reject) => {
                const imagePromise = makeImage(file);

                imagePromise
                    .then((imageObj) => {
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');

                        canvas['width'] = imageObj.height;
                        canvas['height'] = imageObj.width;

                        context.translate(canvas.width / 2, canvas.height / 2);
                        context.rotate((degrees * Math.PI) / 180);

                        context.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);
                        context.rotate(-((degrees * Math.PI) / 180));
                        context.translate(-canvas.width / 2, -canvas.height / 2);

                        canvas.toBlob((blob) => resolve(blob), imageType);
                    })
                    .catch((reason) => reject(reason));
            });
        },
        [makeImage],
    );

    const rotate = useCallback(
        (index: number, deg = 0) => {
            rotateImage(cropperFiles[index].file, cropperFiles[index].file.type, deg).then((blob) => {
                prepareFile(blobToFile(blob, cropperFiles[index].file)).then((value) => {
                    setCropperFiles((files) => {
                        files[index] = value;
                        return [...files];
                    });
                });
            });
        },
        [blobToFile, cropperFiles, prepareFile, rotateImage],
    );

    const convertPdfCanvasToPreview = useCallback((pdfCanvas: HTMLCanvasElement) => {
        const canvasPreview = document.createElement('canvas');
        const contextPreview = canvasPreview.getContext('2d');
        const ratio = pdfCanvas.height / pdfCanvas.width;

        if (ratio >= 1) {
            canvasPreview.height = Math.min(pdfCanvas.height, 1000);
            canvasPreview.width = canvasPreview.height / ratio;
        } else {
            canvasPreview.width = Math.min(pdfCanvas.width, 1000);
            canvasPreview.height = canvasPreview.width * ratio;
        }

        const position = cover(canvasPreview.width, canvasPreview.height, pdfCanvas.width, pdfCanvas.height);

        contextPreview.drawImage(pdfCanvas, position.offsetX, position.offsetY, position.width, position.height);

        return canvasPreview;
    }, []);

    const pdfToBlob = useCallback(
        (rawPdfFile): Promise<Blob> => {
            return new Promise((resolve) => {
                new Response(rawPdfFile).arrayBuffer().then((data) => {
                    window['pdfjsDist'].getDocument({ data }).promise.then(
                        (pdf: {
                            numPages: number;
                            getPage: (arg0: number) => Promise<{
                                getViewport: ({ scale }) => { height: number; width: number };
                                render: ({ canvasContext, viewport }) => { promise: Promise<() => void> };
                            }>;
                        }) => {
                            pdf.getPage(1).then((page) => {
                                const viewport = page.getViewport({ scale: 1.5 });
                                const canvas = document.createElement('canvas');
                                const canvasContext = canvas.getContext('2d');

                                canvas.height = viewport.height;
                                canvas.width = viewport.width;

                                page.render({ canvasContext, viewport }).promise.then(() => {
                                    convertPdfCanvasToPreview(canvas).toBlob((blob) => resolve(blob), 'image/jpeg');
                                });
                            });
                        },
                        console.error,
                    );
                });
            });
        },
        [convertPdfCanvasToPreview],
    );

    const makePreviews = useCallback(
        (files: Array<ModalPhotoCropperFile>) => {
            return Promise.all(
                files.map((fileItem: ModalPhotoCropperFile) => {
                    if (fileIsPdf(fileItem.file)) {
                        return pdfToBlob(fileItem.file).then((blob) => ({
                            ...fileItem,
                            file_preview: new File([blob], 'pdf_preview.jpg', { type: 'image/jpeg' }),
                        }));
                    }

                    return fileItem;
                }),
            );
        },
        [fileIsPdf, pdfToBlob],
    );

    const submit = useCallback(() => {
        makePreviews(cropperFiles).then((files) => {
            onSubmit(
                files.map((fileItem) => {
                    const { file_preview, cropped_photo, is_image } = fileItem;
                    const file = is_image ? blobToFile(cropped_photo, fileItem.file) : fileItem.file;

                    return { file, file_preview };
                }),
            );

            modal.close();
        });
    }, [blobToFile, cropperFiles, makePreviews, modal, onSubmit]);

    const prevMedia = useCallback(() => {
        setFileIndex((fileIndex) => (fileIndex <= 0 ? cropperFiles.length : fileIndex) - 1);
    }, [cropperFiles?.length]);

    const nextMedia = useCallback(() => {
        setFileIndex((fileIndex) => (fileIndex >= cropperFiles.length - 1 ? 0 : fileIndex + 1));
    }, [cropperFiles?.length]);

    const replaceFileAtIndex = useCallback(
        (index) => {
            const input = replaceInputRef?.current;

            input.addEventListener('change', (e: React.ChangeEvent<HTMLInputElement>) => {
                prepareFile(e.target.files[0])
                    .then((file) => {
                        setCropperFiles((cropperFiles) => {
                            cropperFiles[index] = file;
                            return [...cropperFiles];
                        });
                    })
                    .catch(() => pushDanger('Error!', 'Selected file is not a valid image.'))
                    .finally(() => (input.files = null));
            });

            input.click();
        },
        [prepareFile, pushDanger],
    );

    const onCropperChange = useCallback((file: ModalPhotoCropperFile, previewData: Blob) => {
        onImageLoadDone(file, previewData);
    }, []);

    useEffect(() => {
        const promises = files.map(
            (file) => new Promise((resolve) => prepareFile(file).then(resolve, () => resolve(false))),
        );

        Promise.all(promises).then((files) => {
            const validFiles = files.filter((file) => file !== false);
            const invalidFiles = files.filter((file) => file == false);

            setCropperFiles(validFiles);

            if (invalidFiles.length && validFiles.length) {
                return pushDanger('Error! Some of the selected cropperFiles are not valid images and are skipped.');
            }

            if (invalidFiles.length && !validFiles.length) {
                pushDanger('Error! Uploaded file is not a valid image, please try another file.');
                modal.close();
            }
        });
    }, [files, modal, prepareFile, pushDanger]);

    return (
        <div
            className={`modal modal-animated modal-photo-cropper ${modal.loading ? '' : 'modal-loaded'}`}
            data-dusk={'modalPhotoCropper'}>
            <div className="modal-backdrop" onClick={modal.close} />
            <div className="modal-window">
                <div
                    className="modal-close mdi mdi-close"
                    onClick={modal.close}
                    tabIndex={0}
                    onKeyDown={clickOnKeyEnter}
                    aria-label="Sluiten"
                    role="button"
                />

                <div className="modal-header">
                    <h2 className="modal-header-title">Upload een document</h2>
                </div>

                <div className="modal-body">
                    <div className="modal-section">
                        <h2 className="modal-section-title">Verplaats en wijzig grootte</h2>
                        <div className="modal-section-description">
                            Links ziet u de originele afbeelding en rechts de voorbeelden. Gebruik het vakje in de
                            linker afbeelding om de foto te positioneren.
                        </div>
                        <div className="modal-section-space" />
                        <div className="modal-section-space" />
                        <div className="cropper-media">
                            <div className="cropper-preview">
                                {cropperFiles?.map((file, index) => (
                                    <div
                                        key={file.uid}
                                        className={`cropper-preview-container ${
                                            index !== fileIndex ? 'cropper-preview-container-inactive' : ''
                                        }`}>
                                        {file.is_image && file.file && (
                                            <ModalPhotoCropperControl file={file} onCropperChange={onCropperChange} />
                                        )}

                                        {file.is_pdf && file.file && (
                                            <PdfPreview className={'file-pdf'} rawPdfFile={file.file} />
                                        )}

                                        {!file.is_image && !file.is_pdf && (
                                            <div className="cropper-preview-placeholder">
                                                <div className="cropper-preview-placeholder-media">
                                                    <div className="mdi mdi-file-outline" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="cropper-pagination">
                                <div
                                    className="cropper-pagination-btn"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={clickOnKeyEnter}
                                    onClick={prevMedia}
                                    aria-label="Vorige"
                                    title="Vorige">
                                    <em className="mdi mdi-chevron-left" />
                                </div>
                                <div className="cropper-pagination-nav">
                                    {files?.map((_, index) => (
                                        <div
                                            key={index}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={clickOnKeyEnter}
                                            className={`cropper-pagination-item ${index === fileIndex ? 'active' : ''}`}
                                            onClick={() => setFileIndex(index)}
                                            aria-label={`Toon afbeelding nummer: ${index + 1}`}
                                        />
                                    ))}
                                </div>
                                <div
                                    className="cropper-pagination-btn"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={clickOnKeyEnter}
                                    onClick={nextMedia}
                                    aria-label="Volgende"
                                    title="Volgende">
                                    <em className="mdi mdi-chevron-right" />
                                </div>
                            </div>

                            <div className="cropper-actions">
                                <div className="cropper-rotate">
                                    {cropperFiles[fileIndex]?.is_image && (
                                        <div
                                            className="cropper-rotate-btn"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={clickOnKeyEnter}
                                            onClick={() => rotate(fileIndex, -90)}
                                            aria-label="90 graden rechtsom draaien"
                                            title="90 graden rechtsom draaien">
                                            <div className="mdi mdi-file-rotate-left-outline" />
                                        </div>
                                    )}

                                    {cropperFiles[fileIndex]?.is_image && (
                                        <div
                                            className="cropper-rotate-btn"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={clickOnKeyEnter}
                                            onClick={() => rotate(fileIndex, 90)}
                                            aria-label="90 graden linkssom draaien"
                                            title="90 graden linkssom draaien">
                                            <div className="mdi mdi-file-rotate-right-outline" />
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="cropper-action-change"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={clickOnKeyEnter}
                                    onClick={() => replaceFileAtIndex(fileIndex)}
                                    title="Kies andere afbeelding">
                                    <input type="file" accept={accept.join(',')} hidden={true} ref={replaceInputRef} />
                                    <div className="mdi mdi-pencil" />
                                    Kies andere afbeelding
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <div className="button-group">
                        <button
                            className="button button-light button-sm"
                            data-dusk="modalPhotoCropperCancel"
                            onClick={modal.close}>
                            Annuleren
                        </button>

                        <button
                            className="button button-primary button-sm"
                            data-dusk="modalPhotoCropperSubmit"
                            onClick={submit}
                            disabled={!loaded}>
                            {!loaded && <div className="mdi mdi-loading mdi-spin icon-start" />}
                            {loaded ? 'Indienen' : 'Loading'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
