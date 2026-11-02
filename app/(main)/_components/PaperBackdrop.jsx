// Folded orange paper shapes behind a page's content. Purely decorative.
// Fills the whole <main> area (layout sets it to relative) and scrolls with the page.
// The page wrapper must be `isolate` (not relative) so the shapes sit behind its cards.
function PaperBackdrop() {
    return (
        <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
            <div className='paper-lift absolute inset-0'>
                <div className='fold-shard-top left-[40%] top-0 h-[150px] w-[260px] opacity-90' />
                <div className='fold-shard-left -left-2 top-[58%] h-[140px] w-[64px] opacity-90' />
            </div>
            <div className='paper-waves inset-x-0 bottom-0 h-[240px]' />
        </div>
    )
}

export default PaperBackdrop
