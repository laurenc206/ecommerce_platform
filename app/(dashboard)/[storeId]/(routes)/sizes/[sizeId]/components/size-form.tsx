"use client";

import * as z from "zod";
import axios from "axios";
import { useState } from 'react'
import { Size } from '@prisma/client';
import { Trash } from 'lucide-react';
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Form, 
         FormControl, 
         FormDescription, 
         FormField, 
         FormItem, 
         FormLabel, 
         FormMessage} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertModal } from "@/components/modals/alert-modal";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
    name: z.string().min(1),
    value: z.string().min(1),
    isLocked: z.boolean().default(false).optional(),
});

type SizeFormValues = z.infer<typeof formSchema>

interface SizeFormProps {
    initialData: Size | null;
};

export const SizeForm: React.FC<SizeFormProps> = ({
    initialData
}) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit size" : "Create size";
    const description = initialData ? "Edit a size" : "Add a new size";
    const toastMessage = initialData ? "Size updated." : "Size created.";
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<SizeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: '',
            value: '',
            isLocked: false,
        }
    });

    const onSubmit = async (data: SizeFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/sizes/${params.sizeId}`, data);
            } else {
                await axios.post(`/api/${params.storeId}/sizes`, data);
            }
            router.push(`/${params.storeId}/sizes`)
            router.refresh();
            toast.success(toastMessage);
        } catch (error) {
            if (error instanceof Error && error.message.includes("409")) {
                router.push(`/${params.storeId}/sizes`)
                router.refresh();
                toast.error("Locked items can't be modified.");
            } else {
                toast.error("Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true)
            await axios.delete(`/api/${params.storeId}/sizes/${params.sizeId}`);
            router.push(`/${params.storeId}/sizes`);
            router.refresh();
            toast.success("Size deleted.");
        } catch (error) {
            if (error instanceof Error && error.message.includes("409")) {
                router.push(`/${params.storeId}/sizes`)
                router.refresh();
                toast.error("Locked items can't be deleted.");
            } else {
                toast.error("Make sure you removed all products using this size first.");
            }   
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <AlertModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={onDelete}
                loading={loading}
            />
            <div className="flex items-center justify-between">
                <Heading
                    title={title}
                    description={description}
                />
                {initialData && (
                    <Button
                        disabled={loading}
                        variant="destructive"
                        size="sm"
                        onClick={() => {setOpen(true)}}
                    >
                        <Trash className="h-4 w-4"/>
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">       
                    <div className="gap-y-6 gap-x-6 flex w-full flex-wrap">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="relative max-w-[400px] w-full">
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input className="w-full max-w-[400px]" disabled={loading} placeholder="Size name" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem className="relative max-w-[400px] w-full">
                                    <FormLabel>Value</FormLabel>
                                    <FormControl>
                                        <Input className="w-full max-w-[400px]" disabled={loading} placeholder="Size value" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                                            <FormField
                            control={form.control}
                            name="isLocked"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 max-w-[400px] w-full">
                                    <FormControl>
                                        <Checkbox 
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Locked
                                        </FormLabel>
                                        <FormDescription className="text-xs sm:text-sm pt-2">
                                            This size can't be modified
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};

