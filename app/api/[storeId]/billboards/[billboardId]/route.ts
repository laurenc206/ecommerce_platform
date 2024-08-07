import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET (
    req: Request,
    { params }: { params: { billboardId: string } }
) {
    try {
        if (!params.billboardId) {
            return new NextResponse("Billboard id is required", { status: 400 });
        }

        const billboard = await prismadb.billboard.findUnique({
            where: {
                id: params.billboardId,
            },    
        });

        return NextResponse.json(billboard);
    } catch (error) {
        console.log('[BILLBOARD_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
};

export async function DELETE (
    req: Request,
    { params }: { params: { storeId: string, billboardId: string } }
) {
    try {
        const { userId } = auth();

        if (!userId){
            return new NextResponse("Unauthenticated", { status: 403 });
        }

        if (!params.billboardId) {
            return new NextResponse("Billboard id is required", { status: 400 });
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

        const billboard = await prismadb.billboard.findFirst({
            where: {
                id: params.billboardId
            }
        })

        if (billboard?.isLocked) {
            return new NextResponse("Conflict", { status: 409 })
        }

        const res = await prismadb.billboard.delete({
            where: {
                id: params.billboardId,
            },    
        });

        return NextResponse.json(res);
    } catch (error) {
        console.log('[BILLBOARD_DELETE]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
};

export async function PATCH (
    req: Request,
    { params }: { params: { storeId: string, billboardId: string } }
) {
    try {
        const { userId } = auth();

        const body = await req.json();

        const { label, imageUrl, isFeatured, isLocked } = body;

        if (!userId){
            return new NextResponse("Unauthenticated", { status: 403 });
        }

        if (!label) {
            return new NextResponse("Label is required", { status: 400});
        }

        if (!imageUrl) {
            return new NextResponse("Image URL is required", { status: 400});
        }

        if (!params.billboardId) {
            return new NextResponse("Billboard id is required", { status: 400 });
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

        const billboard = await prismadb.billboard.findFirst({
            where: {
                id: params.billboardId
            }
        })

        if (billboard?.isLocked) {
            return new NextResponse("Conflict", { status: 409 })
        }

        const billboard_update = await prismadb.billboard.update({
            where: {
                id: params.billboardId,
            },
            data: {
                label,
                imageUrl,
                isFeatured,
                isLocked
            }
        });

        return NextResponse.json(billboard_update);
    } catch (error) {
        console.log('[BILLBOARD_PATCH]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
};