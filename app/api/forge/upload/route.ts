import { NextRequest, NextResponse } from 'next/server';
import { forgeClient, ForgeClient } from '@/lib/forge';

/**
 * POST /api/forge/upload
 * Upload a file to Forge bucket and start translation
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucketKey = formData.get('bucketKey') as string;
    const objectName = formData.get('objectName') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'Missing file', message: 'File is required' },
        { status: 400 }
      );
    }

    if (!bucketKey) {
      return NextResponse.json(
        { error: 'Missing bucketKey', message: 'bucketKey is required' },
        { status: 400 }
      );
    }

    const finalObjectName = objectName || file.name;
    const contentType = file.type || 'application/octet-stream';

    // Upload file
    const uploadResult = await forgeClient.uploadFile({
      bucketKey,
      objectName: finalObjectName,
      file,
      contentType,
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error, message: uploadResult.message },
        { status: 400 }
      );
    }

    const uploadedObject = uploadResult.data!;
    
    // Generate URN for translation
    const urn = ForgeClient.generateUrn(uploadedObject.objectId);

    // Start translation
    const translationResult = await forgeClient.translateModel(urn, ['svf2', 'thumbnail']);

    if (!translationResult.success) {
      console.warn('Translation failed:', translationResult.error);
      // Return upload success even if translation fails
      return NextResponse.json({
        success: true,
        data: {
          upload: uploadedObject,
          urn,
          translation: null,
          translationError: translationResult.error,
        },
        message: 'File uploaded successfully, but translation failed',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        upload: uploadedObject,
        urn,
        translation: translationResult.data,
      },
      message: 'File uploaded and translation started successfully',
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/forge/upload?bucketKey={bucketKey}
 * Get objects in bucket
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucketKey = searchParams.get('bucketKey');

    if (!bucketKey) {
      return NextResponse.json(
        { error: 'Missing bucketKey', message: 'bucketKey parameter is required' },
        { status: 400 }
      );
    }

    const result = await forgeClient.getBucketObjects(bucketKey);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get objects error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to get objects' },
      { status: 500 }
    );
  }
}