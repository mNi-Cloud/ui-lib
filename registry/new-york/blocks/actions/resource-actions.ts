'use server';

import { revalidatePath } from 'next/cache';

export type ResourceData = Record<string, unknown>;

export async function fetchResource(endpoint: string, resourceId: string) {
  try {
    const url = `${endpoint}/${resourceId}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
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

export async function fetchResources(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
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

export async function createResource(
  endpoint: string, 
  data: { type: string; data: ResourceData }, 
  redirectPath?: string
) {
  try {
    const response = await fetch(endpoint, {
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

export async function updateResource(
  endpoint: string, 
  resourceId: string, 
  data: { type: string; data: ResourceData }, 
  redirectPath?: string
) {
  try {
    const url = `${endpoint}/${resourceId}`;
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