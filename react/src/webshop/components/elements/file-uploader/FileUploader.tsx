import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFileService } from '../../../../dashboard/services/FileService';
import FileModel from '../../../../dashboard/props/models/File';
import useOpenModal from '../../../../dashboard/hooks/useOpenModal';
import ModalPhotoCropper from '../../modals/modal-photo-cropper/ModalPhotoCropper';
import FileUploaderItemView from './FileUploaderItemView';
import usePushInfo from '../../../../dashboard/hooks/usePushInfo';
import { uniqueId } from 'lodash';

export type FileUploaderItem = {
    id?: string;
    file?: File;
    file_data?: FileModel;
    uploading?: boolean;
    uploaded?: boolean;
    error?: Array<string>;
    progress?: number;
    has_preview?: boolean;
    file_preview?: File;
};

type FileItemEvent = {
    fileItems: Array<FileUploaderItem>;
    fileItem?: FileUploaderItem;
    files: Array<FileModel>;
};

type FileItemEventsListener = {
    onFileError?: (e: FileItemEvent) => void;
    onFileQueued?: (e: FileItemEvent) => void;
    onFileRemoved?: (e: FileItemEvent) => void;
    onFileResolved?: (e: FileItemEvent) => void;
    onFileUploaded?: (e: FileItemEvent) => void;
    onFilesChange?: (e: FileItemEvent) => void;
};

export default function FileUploader({
    type,
    title = 'Document slepen & neer zetten',
    files = null,
    compact = false,
    multiple = false,
    multipleSize = null,
    cropMedia = true,
    readOnly = false,
    acceptedFiles = ['.xlsx', '.xls', '.docx', '.doc', '.pdf', '.png', '.jpg', '.jpeg'],
    onFileError = null,
    onFileQueued = null,
    onFileRemoved = null,
    onFileResolved = null,
    onFileUploaded = null,
    onFilesChange = null,
    hideButtons = false,
    fileListCompact = false,
}: {
    type: 'fund_request_clarification_proof' | 'reimbursement_proof' | 'fund_request_record_proof';
    title?: string;
    files?: Array<FileModel>;
    compact?: boolean;
    multiple?: boolean;
    multipleSize?: number;
    cropMedia?: boolean;
    readOnly?: boolean;
    acceptedFiles?: Array<string>;
    hideButtons?: boolean;
    fileListCompact?: boolean;
} & FileItemEventsListener) {
    const fileService = useFileService();

    const pushInfo = usePushInfo();
    const openModal = useOpenModal();

    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const filesRef = useRef<Array<FileUploaderItem>>(null);
    const callbackRef = useRef<FileItemEventsListener>(null);

    const [fileItems, setFileItems] = useState(
        files?.map(
            (file): FileUploaderItem => ({
                id: uniqueId('file_uploader_'),
                file: null,
                file_data: file,
                has_preview: ['pdf', 'png', 'jpeg', 'jpg'].includes(file.ext),
                uploaded: true,
            }),
        ) || [],
    );

    const updateItem = (id: string, updater: (item: FileUploaderItem) => FileUploaderItem) => {
        setFileItems((fileItems) => {
            const index = fileItems.findIndex((file) => file.id == id);

            if (index !== -1) {
                fileItems[index] = updater(fileItems[index]);
            }

            return [...fileItems];
        });
    };

    const makeFileEvent = useCallback(
        (fileItems: Array<FileUploaderItem>, fileItem?: FileUploaderItem): FileItemEvent => {
            return {
                files: fileItems?.map((item) => item?.file_data).filter((file_data) => file_data),
                fileItem: fileItem,
                fileItems: fileItems,
            };
        },
        [],
    );

    const uploadFile = useCallback(
        (fileItem: FileUploaderItem) => {
            fileItem.uploading = true;

            fileService
                .storeWithProgress({
                    file: fileItem.file,
                    type: type,
                    preview: fileItem?.file_preview,
                    onProgress: ({ progress }) => updateItem(fileItem.id, (item) => ({ ...item, progress })),
                })
                .then((res) => {
                    updateItem(fileItem.id, (item) => ({
                        ...item,
                        progress: 1,
                        uploaded: true,
                        file_data: res.data.data,
                        has_preview: ['pdf', 'png', 'jpeg', 'jpg'].includes(item?.file_data?.ext),
                    }));

                    callbackRef?.current?.onFileUploaded?.(makeFileEvent(filesRef?.current, fileItem));
                })
                .catch((res) => {
                    const error = res?.data?.errors?.file || res?.data?.errors?.type;

                    updateItem(fileItem.id, (item) => ({
                        ...item,
                        error: error || res?.data?.message ? [res?.data?.message] : [],
                    }));

                    callbackRef?.current?.onFileError?.(makeFileEvent(filesRef?.current, fileItem));
                })
                .finally(() => {
                    updateItem(fileItem.id, (item) => ({
                        ...item,
                        uploading: false,
                    }));

                    callbackRef?.current?.onFileResolved?.(makeFileEvent(filesRef?.current, fileItem));
                });

            callbackRef?.current?.onFileQueued?.(makeFileEvent(filesRef?.current, fileItem));

            return fileItem;
        },
        [fileService, makeFileEvent, type],
    );

    const prepareFilesForUpload = useCallback(
        async (files: Array<File>): Promise<Array<FileUploaderItem>> => {
            return new Promise((resolve) => {
                if (!cropMedia) {
                    return resolve(
                        files.map((file) => uploadFile({ id: uniqueId(), file, uploaded: false, progress: 0 })),
                    );
                }

                openModal((modal) => (
                    <ModalPhotoCropper
                        modal={modal}
                        accept={acceptedFiles}
                        files={files}
                        onSubmit={(files) => {
                            resolve(
                                files.map((item) =>
                                    uploadFile({
                                        id: uniqueId(),
                                        file: item.file,
                                        file_preview: item.file_preview || null,
                                        uploaded: false,
                                        progress: 0,
                                    }),
                                ),
                            );
                        }}
                    />
                ));
            });
        },
        [acceptedFiles, cropMedia, openModal, uploadFile],
    );

    const uploadFiles = useCallback(
        (files: Array<File>) => {
            const filesSpaceLeft = multipleSize ? multipleSize - fileItems.length : 100;

            if (filesSpaceLeft < files.length) {
                files.splice(filesSpaceLeft);

                pushInfo(
                    'To many files selected',
                    `Files count limit exceeded, only first ${filesSpaceLeft} files added.`,
                );
            }

            prepareFilesForUpload(files).then((filteredFiles) => {
                setFileItems((fileItems) => [...fileItems, ...filteredFiles]);
            });
        },
        [fileItems.length, multipleSize, prepareFilesForUpload, pushInfo],
    );

    const filterSelectedFiles = useCallback(
        (files: FileList) => {
            return [...files].filter((file) => {
                return acceptedFiles.includes('.' + file.name.split('.')[file.name.split('.').length - 1]);
            });
        },
        [acceptedFiles],
    );

    const removeFile = useCallback(
        (file: FileUploaderItem) => {
            fileItems.splice(fileItems.indexOf(file), 1);

            setFileItems([...fileItems]);

            callbackRef?.current?.onFileRemoved?.(makeFileEvent(filesRef?.current));
        },
        [fileItems, makeFileEvent],
    );

    const onDragEvent = useCallback((e, isDragOver: boolean) => {
        e?.preventDefault();
        e?.stopPropagation();

        setIsDragOver(isDragOver);
    }, []);

    useEffect(() => {
        callbackRef.current = {
            onFileError,
            onFileQueued,
            onFileRemoved,
            onFileResolved,
            onFileUploaded,
            onFilesChange,
        };
    }, [onFileError, onFileQueued, onFileRemoved, onFileResolved, onFileUploaded, onFilesChange]);

    useEffect(() => {
        filesRef.current = fileItems;
    }, [fileItems]);

    useEffect(() => {
        callbackRef?.current?.onFilesChange?.({
            fileItems,
            files: fileItems.map((item) => item?.file_data).filter((file) => file),
        });
    }, [fileItems]);

    return (
        <div
            className={`block block-file-uploader ${compact ? 'block-file-uploader-compact' : ''}`}
            data-dusk="fileUploader">
            <input
                type="file"
                hidden={true}
                multiple={multiple}
                accept={(acceptedFiles || []).join(',')}
                ref={inputRef}
                onChange={(e) => {
                    uploadFiles(filterSelectedFiles(e.target.files));
                    e.target.value = null;
                }}
            />
            {!readOnly && (
                <div
                    className={`uploader-droparea ${isDragOver ? 'is-dragover' : ''}`}
                    onDragOver={(e) => onDragEvent(e, true)}
                    onDragEnter={(e) => onDragEvent(e, true)}
                    onDragLeave={(e) => onDragEvent(e, false)}
                    onDragEnd={(e) => onDragEvent(e, false)}
                    onDrop={(e) => {
                        onDragEvent(e, false);
                        uploadFiles(filterSelectedFiles(e.dataTransfer.files));
                    }}>
                    <div className="droparea-icon">
                        <div className="mdi mdi-tray-arrow-up"></div>
                    </div>
                    <div className="droparea-title">
                        <strong>{title}</strong>
                        <br />
                        <small>of</small>
                    </div>
                    <div className="droparea-button">
                        <button
                            className={`button ${compact ? 'button-light button-xs' : 'button-primary'}`}
                            data-dusk="fileUploaderBtn"
                            type="button"
                            role="button"
                            disabled={multipleSize && multipleSize <= fileItems.length}
                            onClick={() => inputRef.current?.click()}>
                            <em className={`mdi ${compact ? 'mdi-paperclip' : 'mdi-upload'}`} />
                            Upload een document
                        </button>
                    </div>
                    {!compact && <div className="droparea-size">max. grootte 8Mb</div>}
                    {compact && multipleSize && <div className="droparea-max-limit">Max. {multipleSize} files</div>}
                </div>
            )}

            {fileItems.length > 0 && (
                <div className="uploader-files">
                    {fileItems?.map((file, index) => (
                        <FileUploaderItemView
                            key={index}
                            item={file}
                            compact={fileListCompact}
                            buttons={!hideButtons}
                            readOnly={readOnly}
                            removeFile={removeFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
