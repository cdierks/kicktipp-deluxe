import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getVerifiedUser } from '@/lib/auth-guards'
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
import { PageHeader } from '@/components/page-header'
import { PageFrame } from '@/components/page-frame'
import { formatAppDate } from '@/lib/date-format'

export default async function BenutzerAdminPage() {
  const user = await getVerifiedUser()
  if (user?.role !== 'ADMIN') redirect('/dashboard')

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
    <PageFrame>
      <PageHeader eyebrow="Adminbereich" title="Benutzerverwaltung" description="Konten, Rollen und Tippaktivität im Überblick." />
      <div className="surface-raised overflow-hidden rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Nickname</TableHead>
              <TableHead className="hidden md:table-cell">E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Tipps</TableHead>
              <TableHead className="hidden lg:table-cell">Registriert</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium font-sans">{u.name}</TableCell>
                <TableCell className="font-sans text-muted-foreground">
                  <Link href={`/spieler/${u.nickname}`} className="transition-colors hover:text-foreground hover:underline underline-offset-4">
                    {u.nickname}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell font-sans text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">{u._count.tips}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatAppDate(u.createdAt, { dateStyle: 'short' })}
                </TableCell>
                <TableCell>
                  <RoleToggle userId={u.id} currentRole={u.role} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageFrame>
  )
}
