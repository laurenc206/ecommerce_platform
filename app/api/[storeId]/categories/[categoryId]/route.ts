import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET (
    req: Request,
    { params }: { params: { categoryId: string } }
) {
    try {
        if (!params.categoryId) {
            return new NextResponse("Category id is required", { status: 400 });
        }

        const category = await prismadb.category.findUnique({
            where: {
                id: params.categoryId,
            },
            include: {
                billboard: true
            }    
        });

        return NextResponse.json(category);
    } catch (error) {
        console.log('[CATEGORY_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
};

export async function DELETE (
    req: Request,
    { params }: { params: { storeId: string, categoryId: string } }
) {
    try {
        const { userId } = auth();

        if (!userId){
            return new NextResponse("Unauthenticated", { status: 403 });
        }

        if (!params.categoryId) {
            return new NextResponse("Category id is required", { status: 400 });
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

        const category = await prismadb.category.findFirst({
            where: {
                id: params.categoryId
            }
        })

        if (category?.isLocked) {
            return new NextResponse("Conflict", { status: 409 })
        }

        const res = await prismadb.category.delete({
            where: {
                id: params.categoryId,
            },    
        });

        return NextResponse.json(res);
    } catch (error) {
        console.log('[CATEGORY_DELETE]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
};

export async function PATCH (
    req: Request,
    { params }: { params: { storeId: string, categoryId: string } }
) {
    try {
        const { userId } = auth();

        const body = await req.json();

        const { name, billboardId, isLocked } = body;

        if (!userId){
            return new NextResponse("Unauthenticated", { status: 403 });
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400});
        }

        if (!billboardId) {
            return new NextResponse("Billboard id is required", { status: 400});
        }

        if (!params.categoryId) {
            return new NextResponse("Category id is required", { status: 400 });
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

        const category = await prismadb.category.findFirst({
            where: {
                id: params.categoryId
            }
        })

        if (category?.isLocked) {
            return new NextResponse("Conflict", { status: 409 })
        }

        const res = await prismadb.category.update({
            where: {
                id: params.categoryId,
            },
            data: {
                name,
                billboardId,
                isLocked
            }
        });

        return NextResponse.json(res);
    } catch (error) {
        console.log('[CATEGORY_PATCH]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
};