import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleToggle } from './role-toggle'

export default async function BenutzerAdminPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      nickname: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { tips: true } },
    },
  })

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold uppercase tracking-wider text-foreground">
        Benutzerverwaltung
      </h1>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase tracking-wide text-xs">Name</TableHead>
              <TableHead className="uppercase tracking-wide text-xs">Nickname</TableHead>
              <TableHead className="hidden md:table-cell uppercase tracking-wide text-xs">E-Mail</TableHead>
              <TableHead className="uppercase tracking-wide text-xs">Rolle</TableHead>
              <TableHead className="hidden sm:table-cell text-right uppercase tracking-wide text-xs">Tipps</TableHead>
              <TableHead className="hidden lg:table-cell uppercase tracking-wide text-xs">Registriert</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium font-sans">{u.name}</TableCell>
                <TableCell className="font-sans text-muted-foreground">{u.nickname}</TableCell>
                <TableCell className="hidden md:table-cell font-sans text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs uppercase tracking-wide">
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">{u._count.tips}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString('de-DE')}
                </TableCell>
                <TableCell>
                  <RoleToggle userId={u.id} currentRole={u.role} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
