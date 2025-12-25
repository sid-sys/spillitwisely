import { getInitials } from '@/lib/utils';

export default function Avatar({ user, size = 'md', className = '' }) {
    if (!user) return <div className={`avatar avatar-${size} ${className}`}>?</div>;

    return (
        <div className={`avatar avatar-${size} ${className}`} title={user.name}>
            {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} />
            ) : (
                <span>{getInitials(user.name)}</span>
            )}
        </div>
    );
}
