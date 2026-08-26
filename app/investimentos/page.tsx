import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { listInvestments } from '@/lib/data/investments';
import { Resumo } from './resumo';
import { RendaFixa } from './renda-fixa';
import { RendaVariavel } from './renda-variavel';
import { ReservaEmergencia } from './reserva-emergencia';

export default async function InvestimentosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const investments = await listInvestments();
  const rendaFixa = investments.filter((i) => i.type === 'renda_fixa');
  const rendaVariavel = investments.filter((i) => i.type === 'renda_variavel');
  const reservaEmergencia = investments.filter((i) => i.type === 'reserva_emergencia');

  return (
    <div className="min-h-screen">
      <Nav activePath="/investimentos" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Investimentos</h1>
        <Resumo investments={investments} />
        <RendaFixa investments={rendaFixa} />
        <RendaVariavel investments={rendaVariavel} />
        <ReservaEmergencia investments={reservaEmergencia} />
      </main>
    </div>
  );
}
