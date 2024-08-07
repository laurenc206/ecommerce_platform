import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET (
    req: Request,
    { params }: { params: { productId: string } }
) {
    try {
        if (!params.productId) {
            return new NextResponse("Product id is required", { status: 400 });
        }

        const product = await prismadb.product.findUnique({
            where: {
                id: params.productId,
            },
            include: {
                images: true,
                category: true,
                subcategory: true,
                size: true,
                color: true,
            }    
        });

        return NextResponse.json(product);
    } catch (error) {
        console.log('[PRODUCT_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
};

export async function DELETE (
    req: Request,
    { params }: { params: { storeId: string, productId: string } }
) {
    try {
        const { userId } = auth();

        if (!userId){
            return new NextResponse("Unauthenticated", { status: 403 });
        }

        if (!params.productId) {
            return new NextResponse("Product id is required", { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: params.storeId,
                userId
            }
        });
    
        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 405 });
        }
        const product = await prismadb.product.findFirst({
            where: {
                id: params.productId,
            },    
        });

        if (product?.isLocked) {
            return new NextResponse("Conflict", { status: 409 })
        }

        const res = await prismadb.product.delete({
            where: {
                id: params.productId,
            },    
        });

        return NextResponse.json(res);
    } catch (error) {
        console.log('[PRODUCT_DELETE]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
};

export async function PATCH (
    req: Request,
    { params }: { params: { storeId: string, productId: string } }
) {
    try {
        const { userId } = auth();

        const body = await req.json();

        const { 
            name,
            price,
            categoryId,
            subcategoryId,
            colorId,
            sizeId,
            images,
            isFeatured,
            isArchived,
            isLocked,
            description,
         } = body;

        if (!userId){
            return new NextResponse("Unauthenticated", { status: 403 });
        }

  

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }
    
        if (!images || !images.length) {
            return new NextResponse("Images are required", { status: 400 })
        }
    
        if (!price) {
            return new NextResponse("Price is required", { status: 400 });
        }
    
        if (!categoryId) {
            return new NextResponse("Category id is required", { status: 400 });
        }

        if (!subcategoryId) {
            return new NextResponse("Subcategory id is required", { status: 400 });
        }

        if (!params.productId) {
            return new NextResponse("Product id is required", { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: params.storeId,
                userId
            }
        });
    
        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 405 });
        }

        const product = await prismadb.product.findFirst({
            where: {
                id: params.productId
            }
        })

        if (product?.isLocked) {
            return new NextResponse("Conflict", { status: 409 })
        }

        await prismadb.product.update({
            where: {
                id: params.productId,
            },
            data: {
                name,
                price,
                categoryId,
                subcategoryId,
                colorId,
                sizeId,
                images: {
                    deleteMany: {}
                },
                isFeatured,
                isArchived,
                isLocked,
                description
            }
        });

        const res = await prismadb.product.update({
            where: {
                id: params.productId
            },
            data: {
                images: {
                    createMany: {
                        data: [
                            ...images.map((image: { url: string }) => image),
                        ]
                    }
                }
            }

        })

        return NextResponse.json(res);
    } catch (error) {
        console.log('[PRODUCT_PATCH]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
};