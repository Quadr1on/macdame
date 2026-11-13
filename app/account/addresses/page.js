'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase/client'

const emptyForm = {
  type: 'home',
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  is_default: false,
}

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchAddresses = useCallback(async (userId) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error) setAddresses(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login?next=/account/addresses')
      return
    }
    fetchAddresses(user.id)
  }, [user, authLoading, router, fetchAddresses])

  function openAddDialog() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setDialogOpen(true)
  }

  function openEditDialog(address) {
    setEditingId(address.id)
    setForm({
      type: address.type ?? 'home',
      full_name: address.full_name ?? '',
      phone: address.phone ?? '',
      address_line1: address.address_line1 ?? '',
      address_line2: address.address_line2 ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      pincode: address.pincode ?? '',
      is_default: address.is_default ?? false,
    })
    setError('')
    setDialogOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')

    if (!form.full_name || !form.phone || !form.address_line1 || !form.city || !form.state || !form.pincode) {
      setError('Please fill in all required fields')
      return
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      setError('Pincode must be 6 digits')
      return
    }

    setSaving(true)

    if (form.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    }

    const payload = { ...form, user_id: user.id }

    const { error: saveError } = editingId
      ? await supabase.from('addresses').update(payload).eq('id', editingId)
      : await supabase.from('addresses').insert([payload])

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setDialogOpen(false)
    fetchAddresses(user.id)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this address?')) return
    await supabase.from('addresses').delete().eq('id', id)
    fetchAddresses(user.id)
  }

  async function handleSetDefault(id) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    fetchAddresses(user.id)
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1
                className="font-display text-3xl md:text-4xl font-bold text-[var(--color-primary-dark)]"
              >
                Saved Addresses
              </h1>
              <p className="text-gray-500 mt-1">Manage the addresses you deliver to</p>
            </div>
            <Button
              onClick={openAddDialog}
              className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          </div>

          {loading || authLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-28 bg-gray-200 rounded-xl"></div>
              <div className="h-28 bg-gray-200 rounded-xl"></div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl">
              <div className="w-20 h-20 rounded-full bg-[var(--color-cream-dark)] flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-[var(--color-primary)]/40" />
              </div>
              <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
                No addresses yet
              </h2>
              <p className="text-gray-500 mb-6 max-w-sm">
                Add a delivery address to speed up checkout.
              </p>
              <Button
                onClick={openAddDialog}
                className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
              >
                Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] bg-[var(--color-cream)] px-2 py-0.5 rounded">
                          {address.type}
                        </span>
                        {address.is_default && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{address.full_name}</p>
                      <p className="text-sm text-gray-600">{address.phone}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.address_line1}
                        {address.address_line2 ? `, ${address.address_line2}` : ''}, {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditDialog(address)}
                        className="p-2 text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-cream)] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="mt-3 text-xs font-medium text-[var(--color-primary)] hover:underline"
                    >
                      Set as default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Address' : 'Add Address'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Address Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={form.address_line1}
                onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                placeholder="House no., street"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2 (optional)</Label>
              <Input
                id="address_line2"
                value={form.address_line2}
                onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                placeholder="Landmark, area"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="rounded border-gray-300"
              />
              Set as default address
            </label>

            <DialogFooter>
              <Button
                type="submit"
                disabled={saving}
                className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
