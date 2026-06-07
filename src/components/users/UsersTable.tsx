"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type JSX } from "react";

import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { PageToolbar } from "@/components/shared/PageToolbar";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { EditUserRoleDialog } from "@/components/users/EditUserRoleDialog";
import { UserRoleBadge } from "@/components/users/UserRoleBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUserDate } from "@/lib/format";
import type { PaginatedResult } from "@/lib/pagination";
import type { UserRoleFilter } from "@/lib/filters/users-filters";
import type { UserWithProfile } from "@/types/database.types";

type UsersTableProps = {
  result: PaginatedResult<UserWithProfile>;
  roleFilter: UserRoleFilter;
};

export const UsersTable = ({
  result,
  roleFilter,
}: UsersTableProps): JSX.Element => {
  const [editUser, setEditUser] = useState<UserWithProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserWithProfile | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 md:p-8">
      <PageToolbar
        total={result.total}
        resourceLabel="Users"
        showExport={false}
        selectFilters={[
          {
            paramKey: "role",
            value: roleFilter,
            clearValue: "all",
            placeholder: "Role",
            options: [
              { value: "all", label: "All roles" },
              { value: "admin", label: "Admin" },
              { value: "user", label: "User" },
            ],
          },
        ]}
      />
      <div className=" rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((user) => (
              <TableRow key={user.id} className="border-border">
                <TableCell>
                  <Avatar size="sm">
                    <AvatarFallback>{user.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Link href={`/users/${user.id}`} className="font-medium text-white hover:underline">
                    {user.email}
                  </Link>
                </TableCell>
                <TableCell>
                  <UserRoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatUserDate(user.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(): void => setEditUser(user)}>
                        <Pencil className="size-4" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(): void => setDeleteTarget(user)}
                      >
                        <Trash2 className="size-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
      />
      <EditUserRoleDialog
        user={editUser}
        open={editUser !== null}
        onOpenChange={(open): void => { if (!open) setEditUser(null); }}
      />
      <DeleteUserDialog
        user={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open): void => { if (!open) setDeleteTarget(null); }}
      />
    </div>
  );
};
