import { useEffect, useRef, useState } from 'react';
import { ShellButton } from '../../components/ShellButton';
import { defaultExpenseTagForRole } from '../../lib/helpers';
import { generateId } from '../../lib/storage';
import type { User, UserOtherDocument, UserRole } from '../../types';

const ROLE_OPTIONS: UserRole[] = [
  'Super Admin',
  'Admin',
  'CEO',
  'Management',
  'Salesperson',
  'Installation Team',
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

function isImageDataUrl(s: string) {
  return s.startsWith('data:image/');
}

export type EmployeeFormSavePayload = Omit<User, 'createdAt' | 'updatedAt'>;

export type EmployeeFormProps = {
  mode: 'create' | 'edit';
  initialUser?: User | null;
  onCancel: () => void;
  onSave: (user: EmployeeFormSavePayload) => void;
};

export function EmployeeForm({ mode, initialUser, onCancel, onSave }: EmployeeFormProps) {
  const hydrated = useRef<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [role, setRole] = useState<UserRole>('Salesperson');
  const [jobTitle, setJobTitle] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState<'Active' | 'Inactive'>('Active');
  const [documents, setDocuments] = useState<User['documents']>({
    aadhaar: '',
    pan: '',
    photo: '',
    offerLetter: '',
  });
  const [otherDocuments, setOtherDocuments] = useState<UserOtherDocument[]>([]);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const otherInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'create' && !initialUser) {
      if (hydrated.current !== 'create') {
        hydrated.current = 'create';
        setLoginUsername('');
        setLoginPassword('');
      }
      setJoiningDate((j) => j || new Date().toISOString().slice(0, 10));
      return;
    }
    if (mode !== 'edit' || !initialUser) return;
    if (hydrated.current === initialUser.id) return;
    hydrated.current = initialUser.id;
    setName(initialUser.name);
    setPhone(initialUser.phone);
    setAlternatePhone(initialUser.alternatePhone ?? '');
    setAddress(initialUser.address);
    setAadhaarNumber(initialUser.aadhaarNumber ?? '');
    setDob(initialUser.dob ? initialUser.dob.slice(0, 10) : '');
    setEmail(initialUser.email);
    setSalary(String(initialUser.salary));
    setRole(initialUser.role);
    setJobTitle(initialUser.jobTitle ?? '');
    setJoiningDate(initialUser.joiningDate ? initialUser.joiningDate.slice(0, 10) : '');
    setEmploymentStatus(initialUser.employmentStatus ?? 'Active');
    setDocuments({ ...initialUser.documents });
    setOtherDocuments([...(initialUser.otherDocuments ?? [])]);
    setLoginUsername(initialUser.username);
    setLoginPassword('');
  }, [mode, initialUser]);

  function setDoc(key: keyof User['documents'], v: string) {
    setDocuments((d) => ({ ...d, [key]: v }));
  }

  function removeDoc(key: keyof User['documents']) {
    setDoc(key, '');
  }

  async function onDocFile(key: keyof User['documents'], f: File | null) {
    if (!f) return;
    if (f.size > 2_500_000) {
      alert('File too large (max ~2.5 MB for demo storage).');
      return;
    }
    try {
      const url = await readFileAsDataUrl(f);
      setDoc(key, url);
    } catch {
      alert('Could not read file.');
    }
  }

  async function onOtherFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: UserOtherDocument[] = [...otherDocuments];
    for (let i = 0; i < files.length; i++) {
      const f = files[i]!;
      if (f.size > 2_500_000) continue;
      try {
        const dataUrl = await readFileAsDataUrl(f);
        next.push({ id: generateId('doc'), label: f.name, dataUrl });
      } catch {
        /* skip */
      }
    }
    setOtherDocuments(next);
    if (otherInputRef.current) otherInputRef.current.value = '';
  }

  function removeOther(id: string) {
    setOtherDocuments((prev) => prev.filter((x) => x.id !== id));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const nameTrim = name.trim();
    if (!nameTrim) return;
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length < 10) return;
    const sal = Number(salary);
    if (Number.isNaN(sal) || sal < 0) return;
    const aadhaarDigits = aadhaarNumber.replace(/\D/g, '');
    if (aadhaarNumber.trim() && aadhaarDigits.length !== 12) return;

    const userTrim = loginUsername.trim();
    if (!userTrim) return;
    const passTrim = loginPassword.trim();
    if (mode === 'create' && passTrim.length < 4) return;

    const id = mode === 'edit' && initialUser ? initialUser.id : generateId('usr');
    const expenseTag = defaultExpenseTagForRole(role);
    const finalPassword =
      mode === 'edit' && initialUser
        ? passTrim || initialUser.password
        : passTrim || 'changeme';

    onSave({
      id,
      name: nameTrim,
      phone: digits,
      alternatePhone: alternatePhone.replace(/\D/g, '').slice(-10) || undefined,
      email: email.trim(),
      address: address.trim(),
      aadhaarNumber: aadhaarDigits || undefined,
      dob: dob || '',
      salary: sal,
      role,
      jobTitle: jobTitle.trim() || undefined,
      joiningDate: joiningDate || new Date().toISOString().slice(0, 10),
      employmentStatus,
      documents: { ...documents },
      otherDocuments: [...otherDocuments],
      bankDetails: initialUser?.bankDetails ?? '',
      username: userTrim,
      password: finalPassword,
      userType: initialUser?.userType ?? 'admin',
      expenseTag,
      salaryAdjustments: initialUser?.salaryAdjustments ?? [],
    });
  }

  function DocPreview({
    label,
    value,
    onRemove,
    onPick,
  }: {
    label: string;
    value: string;
    onRemove: () => void;
    onPick: (f: File | null) => void;
  }) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-2 flex items-start gap-3">
          <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
            {value && isImageDataUrl(value) ? (
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : value ? (
              <span className="p-2 text-center text-[10px] text-muted-foreground">File attached</span>
            ) : (
              <span className="text-xs text-muted-foreground">No file</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs">
              <span className="sr-only">Upload {label}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="max-w-[12rem] text-xs"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              />
            </label>
            {value ? (
              <button type="button" className="text-left text-xs text-destructive hover:underline" onClick={onRemove}>
                Remove (✕)
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-8 text-sm" onSubmit={submit}>
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">1. Personal details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Full name *</span>
            <input
              required
              className="input-shell mt-1 w-full"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted-foreground">Phone number *</span>
            <input
              required
              className="input-shell mt-1 w-full"
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted-foreground">Alternate number</span>
            <input
              className="input-shell mt-1 w-full"
              placeholder="Enter alternate number"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Work email *</span>
            <input
              required
              type="email"
              className="input-shell mt-1 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Current address</span>
            <input
              className="input-shell mt-1 w-full"
              placeholder="Enter current address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted-foreground">Aadhaar number</span>
            <input
              className="input-shell mt-1 w-full"
              placeholder="XXXX XXXX XXXX"
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(e.target.value)}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted-foreground">Date of birth</span>
            <input type="date" className="input-shell mt-1 w-full" value={dob} onChange={(e) => setDob(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">2. Role & salary</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="text-xs font-medium text-muted-foreground">Salary (monthly) *</span>
            <input
              type="number"
              min={0}
              required
              className="input-shell mt-1 w-full"
              placeholder="₹ Enter amount"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted-foreground">Role *</span>
            <select className="select-shell mt-1 w-full" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="" disabled>
                Select role
              </option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-medium text-muted-foreground">Designation / job title</span>
            <input
              className="input-shell mt-1 w-full"
              placeholder="e.g. Senior installer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted-foreground">Joining date *</span>
            <input
              type="date"
              required
              className="input-shell mt-1 w-full"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <select
              className="select-shell mt-1 w-full"
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value as 'Active' | 'Inactive')}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Login / portal</h3>
        <p className="text-xs text-muted-foreground">
          {mode === 'edit'
            ? 'Leave password blank to keep the current password. Enter a new password to replace it.'
            : 'Choose a username and password (min. 4 characters) for this employee to sign in.'}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Username *</span>
            <input
              required
              autoComplete="username"
              className="input-shell mt-1 w-full"
              placeholder="e.g. priya.sharma"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">
              Password {mode === 'create' ? '*' : '(optional)'}
            </span>
            <input
              type="password"
              autoComplete={mode === 'create' ? 'new-password' : 'new-password'}
              className="input-shell mt-1 w-full"
              placeholder={mode === 'edit' ? 'Leave blank to keep existing' : 'Min. 4 characters'}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              minLength={mode === 'create' ? 4 : undefined}
              required={mode === 'create'}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">3. Upload docs</h3>
        <p className="text-xs text-muted-foreground">Uploaded files are stored in the browser for this prototype (data URLs).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <DocPreview
            label="Aadhaar card"
            value={documents.aadhaar}
            onRemove={() => removeDoc('aadhaar')}
            onPick={(f) => void onDocFile('aadhaar', f)}
          />
          <DocPreview
            label="Photo"
            value={documents.photo}
            onRemove={() => removeDoc('photo')}
            onPick={(f) => void onDocFile('photo', f)}
          />
          <DocPreview
            label="PAN card"
            value={documents.pan}
            onRemove={() => removeDoc('pan')}
            onPick={(f) => void onDocFile('pan', f)}
          />
          <DocPreview
            label="Offer letter"
            value={documents.offerLetter}
            onRemove={() => removeDoc('offerLetter')}
            onPick={(f) => void onDocFile('offerLetter', f)}
          />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Other documents</p>
          <input
            ref={otherInputRef}
            type="file"
            multiple
            className="mt-2 text-xs"
            onChange={(e) => void onOtherFiles(e.target.files)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {otherDocuments.map((od) => (
              <div
                key={od.id}
                className="relative flex w-28 flex-col overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="flex h-20 items-center justify-center bg-muted/30">
                  {od.dataUrl && isImageDataUrl(od.dataUrl) ? (
                    <img src={od.dataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-1 text-[10px] text-muted-foreground">File</span>
                  )}
                </div>
                <p className="truncate px-1 py-1 text-[10px] text-foreground">{od.label ?? 'Doc'}</p>
                <button
                  type="button"
                  className="border-t border-border py-1 text-[10px] text-destructive hover:bg-destructive/10"
                  onClick={() => removeOther(od.id)}
                >
                  Remove ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <ShellButton type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </ShellButton>
        <ShellButton type="submit" variant="primary">
          {mode === 'create' ? 'Save employee' : 'Save changes'}
        </ShellButton>
      </div>
    </form>
  );
}
