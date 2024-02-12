export default function JobViewBox() {
  return (
    <div className="row-end-9 z-40 col-start-2 col-end-9 row-start-3 p-4">
      <div
        className="h-[64rem] relative z-40 mt-12 rounded border
                      border-slate-400 bg-veryLightGrey p-4 font-medium shadow-md"
      >
        <div className="grid grid-cols-2">
          <div className="pl-4 pt-4">
            <label htmlFor="jobName" className="pr-2 font-bold">
              Name
            </label>
            <span className="">NO2 Mean Explorative data analysis</span>
          </div>

          <div className="pl-4 pt-4">
            <label htmlFor="authorName" className="pr-2 font-bold">
              Author
            </label>
            <span className="">James Mitchell</span>
          </div>

          <div className="pl-4 pt-4">
            <label htmlFor="dateCreated" className="pr-2 font-bold">
              Date Created
            </label>
            <span className="">2024/02/02</span>
          </div>
        </div>

        <div className="py-4 pl-4">
          <label htmlFor="useCaseDescription" className="pr-2 font-bold">
            Description
          </label>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. In
            cursus turpis massa tincidunt dui ut. Nec sagittis aliquam malesuada
            bibendum arcu vitae. Diam donec adipiscing tristique risus. Viverra
            adipiscing at in tellus integer feugiat scelerisque. Sed viverra
            ipsum nunc aliquet bibendum enim facilisis.
          </p>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-50 flex
                        items-center justify-center"
        >
          <div className="text-18xl font-bold text-gray-400/30">Mockup</div>
        </div>

        <iframe
          src="/data.html"
          title="HTML Content"
          className="h-full w-full"
          style={{ pointerEvents: "auto" }}
        ></iframe>
      </div>
    </div>
  );
}
