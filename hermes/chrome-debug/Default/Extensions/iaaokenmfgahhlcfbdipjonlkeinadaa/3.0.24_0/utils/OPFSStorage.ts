/// Copyright (c) 2025 Alexej Plate
/// All rights reserved.
///
/// This repository and its contents are the exclusive property of Alexej Plate.
/// Unauthorized reproduction, modification, or distribution is strictly prohibited.

import { ZipWriter, BlobReader, configure } from "@zip.js/zip.js";

// Configure zip.js to not use web workers (they violate CSP in extensions)
configure({ useWebWorkers: false });

/**
 * Metadata for a download stored in OPFS
 */
export interface DownloadMetadata {
    version: 1;
    taskId: string;
    originalUrl: string;
    title: string;
    downloadDate: string; // ISO 8601
    rootFolderName: string;
    pageCount: number;
    status: 'in_progress' | 'completed' | 'failed';
    maxDepth: number;
}

/**
 * Result of creating a download folder
 */
export interface DownloadFolderResult {
    taskId: string;
    folderHandle: FileSystemDirectoryHandle;
    filesHandle: FileSystemDirectoryHandle;
}

/**
 * Result of writing a file to OPFS
 */
export interface WriteResult {
    success: boolean;
    quotaExceeded: boolean;
}

/**
 * Utility class for managing downloads in Origin Private File System (OPFS)
 *
 * Folder structure:
 * downloads/
 *   {taskId}/
 *     metadata.json
 *     files/
 *       {rootFolder}/
 *         index.html
 *         about/
 *           index.html
 *         README.txt
 */
export class OPFSStorage {
    private static readonly DOWNLOADS_FOLDER = 'downloads';

    /**
     * Estimates available storage space using the Storage API
     * @returns Object with quota, usage, and available bytes, or null if unavailable
     */
    static async estimateStorage(): Promise<{ quota: number; usage: number; available: number } | null> {
        if (!navigator.storage || !navigator.storage.estimate) {
            return null;
        }
        try {
            const estimate = await navigator.storage.estimate();
            const quota = estimate.quota ?? 0;
            const usage = estimate.usage ?? 0;
            return {
                quota,
                usage,
                available: quota - usage
            };
        } catch (e) {
            console.warn('Failed to estimate storage:', e);
            return null;
        }
    }

    /**
     * Gets or creates the root downloads folder in OPFS
     */
    private static async getDownloadsFolder(): Promise<FileSystemDirectoryHandle> {
        const root = await navigator.storage.getDirectory();
        return await root.getDirectoryHandle(this.DOWNLOADS_FOLDER, { create: true });
    }

    /**
     * Creates a new download folder structure for a task
     * @param taskId - Unique identifier for this download task
     * @returns Object containing the task folder and files folder handles
     */
    static async createDownloadFolder(taskId: string): Promise<DownloadFolderResult> {
        const downloadsFolder = await this.getDownloadsFolder();

        // Create task-specific folder
        const folderHandle = await downloadsFolder.getDirectoryHandle(taskId, { create: true });

        // Create files subfolder
        const filesHandle = await folderHandle.getDirectoryHandle('files', { create: true });

        console.log(`Created OPFS download folder: ${this.DOWNLOADS_FOLDER}/${taskId}/files`);

        return { taskId, folderHandle, filesHandle };
    }

    /**
     * Writes an HTML file to the download folder
     * @param filesHandle - Handle to the files directory
     * @param relativePath - Path relative to files folder (e.g., "example_com/about/index.html")
     * @param content - HTML content to write
     * @param savedFiles - Optional Set to track saved files and prevent duplicates
     * @returns WriteResult indicating success/failure and whether quota was exceeded
     */
    static async writeHtmlFile(
        filesHandle: FileSystemDirectoryHandle,
        relativePath: string,
        content: string,
        savedFiles?: Set<string>
    ): Promise<WriteResult> {
        // Check for duplicate
        if (savedFiles?.has(relativePath)) {
            console.log(`Skipping duplicate file: ${relativePath}`);
            return { success: false, quotaExceeded: false };
        }

        try {
            // Parse the path to get directory parts and filename
            const pathParts = relativePath.split('/');
            const filename = pathParts.pop()!;

            // Navigate/create directories
            let currentDir = filesHandle;
            for (const dirName of pathParts) {
                if (dirName) {
                    currentDir = await currentDir.getDirectoryHandle(dirName, { create: true });
                }
            }

            // Create and write the file
            const fileHandle = await currentDir.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            // Track the file
            savedFiles?.add(relativePath);

            return { success: true, quotaExceeded: false };
        } catch (error: unknown) {
            const err = error as { name?: string; message?: string };
            if (err.name === 'QuotaExceededError' ||
                (err.message && err.message.toLowerCase().includes('quota'))) {
                console.error('Storage quota exceeded:', error);
                return { success: false, quotaExceeded: true };
            }
            // Re-throw other errors
            throw error;
        }
    }

    /**
     * Writes metadata for a download
     * @param taskId - The task ID
     * @param metadata - The metadata to write
     */
    static async writeMetadata(taskId: string, metadata: DownloadMetadata): Promise<void> {
        const downloadsFolder = await this.getDownloadsFolder();
        const taskFolder = await downloadsFolder.getDirectoryHandle(taskId);

        const fileHandle = await taskFolder.getFileHandle('metadata.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(metadata, null, 2));
        await writable.close();

        console.log(`Saved metadata for task: ${taskId}`);
    }

    /**
     * Reads metadata for a download
     * @param taskId - The task ID
     * @returns The metadata or null if not found
     */
    static async readMetadata(taskId: string): Promise<DownloadMetadata | null> {
        try {
            const downloadsFolder = await this.getDownloadsFolder();
            const taskFolder = await downloadsFolder.getDirectoryHandle(taskId);
            const fileHandle = await taskFolder.getFileHandle('metadata.json');
            const file = await fileHandle.getFile();
            const content = await file.text();
            return JSON.parse(content) as DownloadMetadata;
        } catch (e) {
            console.warn(`Failed to read metadata for task ${taskId}:`, e);
            return null;
        }
    }

    /**
     * Zips the contents of a download folder
     * @param taskId - The task ID
     * @param outputZipName - Name for the output zip file (will be created in OPFS root)
     * @returns Handle to the created zip file
     */
    static async zipDownloadFolder(taskId: string, outputZipName: string): Promise<FileSystemFileHandle> {
        const downloadsFolder = await this.getDownloadsFolder();
        const taskFolder = await downloadsFolder.getDirectoryHandle(taskId);
        const filesFolder = await taskFolder.getDirectoryHandle('files');

        // Create zip file in OPFS root
        const root = await navigator.storage.getDirectory();
        const zipFileHandle = await root.getFileHandle(outputZipName, { create: true });
        const zipWritable = await zipFileHandle.createWritable();
        const zipWriter = new ZipWriter(zipWritable);

        // Recursively add all files from the files folder
        await this.addDirectoryToZip(zipWriter, filesFolder, '');

        await zipWriter.close();
        console.log(`Created zip file: ${outputZipName}`);

        return zipFileHandle;
    }

    /**
     * Recursively adds directory contents to a ZipWriter
     */
    private static async addDirectoryToZip(
        zipWriter: ZipWriter<unknown>,
        dirHandle: FileSystemDirectoryHandle,
        pathPrefix: string
    ): Promise<void> {
        for await (const [name, handle] of dirHandle.entries()) {
            const entryPath = pathPrefix ? `${pathPrefix}/${name}` : name;

            if (handle.kind === 'file') {
                const fileHandle = handle as FileSystemFileHandle;
                const file = await fileHandle.getFile();
                await zipWriter.add(entryPath, new BlobReader(file));
                console.log(`Added to zip: ${entryPath}`);
            } else {
                // Recursively process subdirectories
                await this.addDirectoryToZip(
                    zipWriter,
                    handle as FileSystemDirectoryHandle,
                    entryPath
                );
            }
        }
    }

    /**
     * Deletes a download folder and all its contents
     * @param taskId - The task ID to delete
     */
    static async deleteDownload(taskId: string): Promise<void> {
        try {
            const downloadsFolder = await this.getDownloadsFolder();
            await downloadsFolder.removeEntry(taskId, { recursive: true });
            console.log(`Deleted OPFS download folder: ${taskId}`);
        } catch (e) {
            console.warn(`Failed to delete download folder ${taskId}:`, e);
        }
    }

    /**
     * Deletes a single file from OPFS root
     * @param fileName - Name of the file to delete
     */
    static async deleteFile(fileName: string): Promise<void> {
        try {
            const root = await navigator.storage.getDirectory();
            await root.removeEntry(fileName);
            console.log(`Deleted OPFS file: ${fileName}`);
        } catch (e) {
            console.warn(`Failed to delete OPFS file ${fileName}:`, e);
        }
    }
}
