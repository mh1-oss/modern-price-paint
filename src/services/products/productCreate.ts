
import { supabase } from "@/integrations/supabase/client";
import { Product } from '@/utils/models/types';
import { mapProductToDbProduct } from '@/utils/models/productMappers';
import { isRlsPolicyError, createRlsError } from '@/services/rls/rlsErrorHandler';

/**
 * Create a new product
 * Returns the created product or throws an error
 */
export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
  try {
    console.log('Creating product with data:', product);
    
    // Check database connection first
    const { data: connectionCheck, error: connectionError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
      
    if (connectionError) {
      // If we have an RLS-related error, handle it gracefully
      if (isRlsPolicyError(connectionError)) {
        console.warn('RLS policy issue detected during create operation');
        throw createRlsError('create');
      }
      
      console.error('Connection error with Supabase:', connectionError);
      throw new Error(`خطأ في الاتصال بقاعدة البيانات: ${connectionError.message}`);
    }
    
    // Use product mapper to create DB object
    const dbProduct = mapProductToDbProduct({
      ...product,
      id: '', // Temporary ID, will be replaced by DB
      category: '' // Category name will be populated later
    });
    
    // Remove fields that should be generated by DB
    delete dbProduct.id;
    delete dbProduct.created_at;
    delete dbProduct.updated_at;
    
    console.log('Converted to DB format:', dbProduct);
    
    const { data, error } = await supabase
      .from('products')
      .insert([dbProduct])
      .select()
      .single();
    
    if (error) {
      if (isRlsPolicyError(error)) {
        console.warn('RLS policy issue detected during create operation');
        throw createRlsError('create');
      }
      
      console.error('Error creating product:', error);
      throw new Error(`فشلت عملية إنشاء المنتج: ${error.message}`);
    }
    
    console.log('Product created successfully:', data);
    
    // Use mapper to convert DB product to app model with proper type handling
    const createdProduct: Product = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      categoryId: data.category_id || '',
      image: data.image_url || '/placeholder.svg',
      images: data.image_url ? [data.image_url] : ['/placeholder.svg'],
      category: '',
      stock: data.stock_quantity || 0,
      featured: data.featured !== undefined ? Boolean(data.featured) : false,
      colors: Array.isArray(data.colors) ? data.colors as string[] : [],
      specifications: typeof data.specifications === 'object' && data.specifications !== null 
        ? data.specifications as Record<string, string> 
        : {},
      mediaGallery: Array.isArray(data.media_gallery) 
        ? data.media_gallery as { url: string; type: 'image' | 'video' }[] 
        : []
    };
    
    return createdProduct;
  } catch (error) {
    console.error('Unexpected error creating product:', error);
    throw error;
  }
};
