# File Upload Component Limitations

**Created**: 2025-08-29
**Status**: MVP - Acceptable  
**Priority**: Medium (Post-MVP)  
**Components**: `useFileUpload`, `UploadedFile`, `ResumeUploadStep`

## Overview

Current file upload implementation is optimized for resume upload functionality but lacks flexibility for general-purpose file uploads across the application.

## Current Limitations

### 1. useFileUpload Hook (`/src/hooks/useFileUpload.ts`)

#### Hard-coded Dependencies

- **Issue**: Tightly coupled to `api.fileUpload.upload` tRPC endpoint
- **Impact**: Cannot use different upload endpoints or external APIs
- **Code Location**: Lines 57-94

```typescript
// Current: Hard-coded endpoint
const uploadFileMutation = api.fileUpload.upload.useMutation({...})
```

#### Fixed Upload Strategy

- **Issue**: Only supports Base64 encoding
- **Impact**: Cannot use FormData, streaming, or direct uploads
- **Code Location**: Lines 117-119

```typescript
// Current: Base64 only
const base64Data = Buffer.from(fileBuffer).toString('base64')
```

#### Limited Callbacks

- **Issue**: No support for custom `onSuccess`, `onError`, `onProgress` callbacks
- **Impact**: Difficult to handle different post-upload workflows
- **Example Use Cases Blocked**:
  - Auto-submit form after upload
  - Navigate to different page
  - Update global state
  - Show custom notifications

### 2. UploadedFile Component (`/src/components/common/UploadedFile.tsx`)

#### Restricted File Types

- **Issue**: Only supports 'PDF', 'DOCX', 'DOC' file types
- **Impact**: Cannot display images, videos, spreadsheets, or other file types
- **Code Location**: Lines 15, 51-76

```typescript
fileType: 'PDF' | 'DOCX' | 'DOC' // Limited to 3 types
```

#### Fixed Icon/Badge Rendering

- **Issue**: Hard-coded icon and badge logic
- **Impact**: Cannot customize appearance for different contexts
- **Code Location**: Lines 51-95

### 3. Domain Coupling

#### Interview Preparation Specific

- **Issue**: Logic assumes interview preparation context
- **Impact**: Requires refactoring for other features
- **Examples**:
  - `interviewPreparationId` parameter
  - Resume-specific validation
  - Fixed file size limits (10MB)

## Impact Analysis

### Features Affected

- ❌ Profile photo upload
- ❌ Document attachments in other contexts
- ❌ Bulk file uploads
- ❌ Image galleries
- ❌ File management dashboard

### Development Impact

- **Code Duplication Risk**: High - developers may copy/paste and modify
- **Maintenance Overhead**: Medium - changes need to be synchronized
- **Testing Complexity**: Medium - multiple similar implementations to test

## Proposed Solutions

### Short-term (Quick Wins)

1. Add optional callback parameters to `useFileUpload`
2. Make file type enum extensible
3. Document current limitations in component JSDoc

### Long-term (Post-MVP)

#### Option 1: Configuration-based Approach

```typescript
interface FileUploadConfig {
  endpoint?: string
  uploadStrategy?: 'base64' | 'formdata' | 'stream'
  acceptedTypes?: string[]
  maxSize?: number
  callbacks?: {
    onSuccess?: (data: any) => void
    onError?: (error: Error) => void
    onProgress?: (progress: number) => void
  }
}

export function useFileUpload(config?: FileUploadConfig)
```

#### Option 2: Composition Pattern

```typescript
// Base components
<FileUploadProvider>
  <FileDropzone />
  <FileList />
  <FileProgress />
</FileUploadProvider>

// Domain-specific implementations
<ResumeUpload />
<ProfilePhotoUpload />
<DocumentUpload />
```

#### Option 3: Adapter Pattern

```typescript
interface UploadAdapter {
  upload(file: File): Promise<UploadResult>
  validate(file: File): ValidationResult
}

class TRPCUploadAdapter implements UploadAdapter {}
class S3DirectUploadAdapter implements UploadAdapter {}
class SupabaseStorageAdapter implements UploadAdapter {}
```

## Migration Strategy

1. **Phase 1**: Document and monitor usage
2. **Phase 2**: Implement configuration options (backward compatible)
3. **Phase 3**: Create generic components
4. **Phase 4**: Migrate existing implementations
5. **Phase 5**: Deprecate old patterns

## Acceptance Criteria for Resolution

- [ ] Support at least 5 different file upload contexts
- [ ] Zero code duplication for upload logic
- [ ] Support multiple upload strategies (Base64, FormData, Direct)
- [ ] Extensible file type system
- [ ] Custom callback support
- [ ] Maintain backward compatibility
- [ ] 90%+ test coverage

## References

- [Component Design Patterns](../rules/view/components/patterns.md)
- [API Integration Guidelines](../rules/backend/api/integration.md)
- [Current Implementation Review](../web/review/nextjs-component-reviews/2025-08-28-17:47-interview-prep-components-review.md)

## Notes

- Current implementation works well for MVP
- Resume upload is the primary use case for now
- Refactoring should be done when second upload context is needed
- Consider using existing libraries (react-dropzone, uppy) for complex scenarios

---

**Next Review Date**: Post-MVP Phase 2 Planning
