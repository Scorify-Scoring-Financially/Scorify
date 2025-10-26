
export default function AppLayout({ children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <header>ini header</header>
            <main>{children}</main>
            <footer>ini footer</footer>
        </>
    )
}