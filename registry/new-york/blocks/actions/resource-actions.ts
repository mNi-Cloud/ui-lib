'use server';

import { revalidatePath } from 'next/cache';

/**
 * リソースを取得するサーバーアクション
 */
export async function fetchResource(url: string) {
  try {
    const response = await fetch(url, { 
      next: { revalidate: 60 } // 60秒間キャッシュする
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching resource:', error);
    throw error;
  }
}

/**
 * リソース一覧を取得するサーバーアクション
 */
export async function fetchResources(url: string) {
  try {
    const response = await fetch(url, { 
      next: { revalidate: 60 } // 60秒間キャッシュする
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.status}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('API response is not an array');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
}

/**
 * リソースを作成するサーバーアクション
 */
export async function createResource(url: string, data: any, redirectPath?: string) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create resource: ${response.status}`);
    }

    if (redirectPath) {
      revalidatePath(redirectPath);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
}

/**
 * リソースを更新するサーバーアクション
 */
export async function updateResource(url: string, data: any, redirectPath?: string) {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update resource: ${response.status}`);
    }

    if (redirectPath) {
      revalidatePath(redirectPath);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
}

/**
 * リソースを削除するサーバーアクション
 */
export async function deleteResource(url: string, redirectPath?: string) {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete resource: ${response.status}`);
    }

    if (redirectPath) {
      revalidatePath(redirectPath);
    }

    return true;
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
}

/**
 * 複数のリソースを削除するサーバーアクション
 */
export async function deleteResources(urls: string[]) {
  try {
    await Promise.all(
      urls.map(url => 
        fetch(url, { method: 'DELETE' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to delete resource at ${url}: ${response.status}`);
            }
            return true;
          })
      )
    );
    return true;
  } catch (error) {
    console.error('Error deleting resources:', error);
    throw error;
  }
}

/**
 * 依存関係をチェックするサーバーアクション
 */
export async function checkResourceDependencies<T>(
  resource: T, 
  checkFn: (resource: T) => Promise<{ hasDependencies: boolean; message?: string }>
) {
  try {
    return await checkFn(resource);
  } catch (error) {
    console.error('Error checking dependencies:', error);
    throw error;
  }
} 