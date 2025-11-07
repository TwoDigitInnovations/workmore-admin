import React, { useMemo, useState, useEffect, useContext } from "react";
import Table from "@/components/table";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import { Api } from "../../services/service";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import { userContext } from "./_app";
import isAuth from "@/components/isAuth";
import { FaEye } from "react-icons/fa";
import { RxCrossCircled } from "react-icons/rx";

function Inventory(props) {
  const router = useRouter();
  const [productsList, setProductsList] = useState([]);
  const [user, setUser] = useContext(userContext);

  const [selectedNewSeller, setSelectedNewSeller] = useState([]);
  const [popupData, setPopupData] = useState({});
  const [viewPopup, setviewPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 4,
  });

  useEffect(() => {
    const savedPage = localStorage.getItem("currentPage");
    if (savedPage) {
      setCurrentPage(Number(savedPage));
    }
  }, []);

  useEffect(() => {
    if (user?._id) {
      getProduct(currentPage, 10, searchTerm); // ✅ limit directly pass karo
    }
  }, [user, currentPage, searchTerm]);

  const getProduct = async (page = 1, limit = 10, search) => {
    props.loader(true);

    let url = `getProduct?page=${page}&limit=${limit}`;

    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search)}`;
    }

    Api("get", url, router).then(
      (res) => {
        props.loader(false);
        console.log("res================>", res.data);

        setProductsList(res.data);

        const selectednewIds = res.data.map((f) => {
          if (f.sponsered && f._id) return f._id;
        });
        setSelectedNewSeller(selectednewIds);

        setPagination(res?.pagination);
      },
      (err) => {
        props.loader(false);
        console.log(err);
        props.toaster({ type: "error", message: err?.message });
      }
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    localStorage.setItem("currentPage", page); // localStorage में save करो
  };

  const deleteProduct = (_id) => {
    Swal.fire({
      text: "Are you sure? You want to delete this Product?",
      icon: "warning",
      showCancelButton: true,
      cancelButtonColor: "#F38529",
      confirmButtonColor: "#F38529",
      confirmButtonText: "Delete",
      width: "360px"
    }).then(function (result) {
      if (result.isConfirmed) {
        const data = {
          _id,
        };

        Api("delete", `deleteProduct/${_id}`, data, router).then(
          (res) => {
            console.log("res================>", res.data?.meaasge);
            props.loader(false);

            if (res?.status) {
              getProduct();
              props.toaster({ type: "success", message: res.data?.meaasge });
            } else {
              console.log(res?.data?.message);
              props.toaster({ type: "error", message: res?.data?.meaasge });
            }
          },
          (err) => {
            props.loader(false);
            console.log(err);
            props.toaster({ type: "error", message: err?.data?.meaasge });
            props.toaster({ type: "error", message: err?.meaasge });
          }
        );
      } else if (result.isDenied) {
      }
    });
  };

  const image = ({ value, row }) => {
    return (
      <div className="md:p-4 flex items-center justify-center">
        {row.original &&
          row.original.varients &&
          row.original.varients.length > 0 && (
            <img
              className="md:h-[76px] md:w-[76px] w-28 h-20 rounded-[10px]"
              src={row.original.varients[0].image[0]}
            />
          )}
      </div>
    );
  };

  const productName = ({ value }) => {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal ">
          {value.slice(0, 35) + "..."}
        </p>
      </div>
    );
  };

  const category = ({ row, value }) => {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">{value}</p>
      </div>
    );
  };

  const price = ({ value, row }) => {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">
          ${row?.original?.price_slot[0]?.our_price}
        </p>
      </div>
    );
  };

  const Quantity = ({ value, row }) => {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">
          {row?.original?.Quantity}
        </p>
      </div>
    );
  };

  const Soldpieces = ({ value }) => {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">{value}</p>
      </div>
    );
  };

  const actionHandler2 = ({ value, row }) => {
    return (
      <div className="bg-custom-offWhiteColor flex items-center  justify-evenly  border border-custom-offWhite rounded-[10px] mr-[10px]">
        <div
          className="py-[10px] w-[50%] items-center flex justify-center cursor-pointer"
          onClick={() => {
            router.push(`add-product?id=${row.original._id}`);
          }}
        >
          <FiEdit className="text-[22px]  " />
        </div>
        <div className="py-[10px] border-l-[1px] border-custom-offWhite w-[50%] items-center flex justify-center">
          <RiDeleteBinLine
            className="text-[red] text-[24px] cursor-pointer"
            onClick={() => deleteProduct(row.original._id)}
          />
        </div>
        <div className="py-[10px] border-l-[1px] border-black w-[50%] items-center flex justify-center">
          <FaEye
            className={`text-[24px] cursor-pointer ${row.original.status === "suspended" ? "text-red-500" : "text-black"
              }`}
            onClick={() => {
              setPopupData(row.original);
              setviewPopup(true);
            }}
          />

        </div>
      </div>
    );
  };

  const columns1 = useMemo(
    () => [
      {
        Header: "Image",
        accessor: "username",
        Cell: image,
      },
      {
        Header: "Product Name",
        accessor: "name",
        Cell: productName,
      },
      {
        Header: "Category",
        accessor: "categoryName",
        Cell: category,
      },
      {
        Header: "Price",
        accessor: "price",
        Cell: price,
      },
      {
        Header: "Quantity",
        accessor: "Quantity",
        Cell: Quantity,
      },
      {
        Header: "Sold Pieces",
        accessor: "sold_pieces",
        Cell: Soldpieces,
      },

      {
        Header: "ACTION",
        Cell: actionHandler2,
      },
    ],
    [selectedNewSeller]
  );

  const suspendProduct = async (productId) => {
    try {
      props.loader(true);

      Api("post", `toggleProductStatus/${productId}`, null, router).then(
        (res) => {
          console.log("res================>", res.data);
          props.loader(false);

          if (res?.status) {
            props.toaster({
              type: "success",
              message: res?.data?.message,
            });
            setviewPopup(false);
            getProduct();

          } else {
            console.log(res?.data?.message);
            props.toaster({ type: "error", message: res?.data?.message });
          }
        }
      );
    } catch (error) {
      props.loader(false);
      console.error("Error suspending product:", error);
      props.toaster({
        type: "error",
        message: "An error occurred while suspending the product.",
      });
    }
  };

  return (
    <div className=" w-full h-full bg-transparent md:pt-5 pt-5 pb-5 pl-5 pr-5">
      {viewPopup && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/30 flex justify-center items-center z-50">
          <div className="relative w-[300px] md:w-[360px] h-auto  bg-white rounded-[15px] m-auto">
            <div
              className="absolute top-2 right-2 p-1 rounded-full  text-black w-8 h-8 cursor-pointer"
              onClick={() => setviewPopup(!viewPopup)}
            >
              <RxCrossCircled className="h-full w-full font-semibold " />
            </div>

            <div className="px-5 py-10">
              <div className=" w-full flex gap-2 pb-5">
                <img
                  src={popupData?.varients[0].image[0]}
                  className="h-[76px] w-[76px] rounded-[10px]"
                />
                <div className="col-span-2 w-full flex flex-col justify-start items-start">
                  <p className="text-base font-bold text-black">
                    {popupData?.name}
                  </p>


                </div>
              </div>

              <div className="flex flex-row justify-start items-start pt-5 gap-5">

                <button
                  className={`text-white text-lg font-bold w-full h-[50px] rounded-[12px] ${popupData?.status === "verified"
                    ? "bg-[#F38529]"
                    : "bg-green-600"
                    }`}
                  onClick={() => suspendProduct(popupData?._id)}
                >
                  {popupData?.status === "verified" ? "Suspend" : "Verify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="md:pt-[0px] pt-[0px] h-full">
        <p className="text-black font-bold md:text-[32px] text-2xl md:ms-5 ms-0">
          <span
            className={`inline-block w-2 h-8 bg-[#F38529]  mr-3 rounded `}
          ></span>
          Inventory
        </p>
        {/* mt-3 */}
        <div className="bg-white  pt-5 md:pb-32  px-5  rounded-[12px] h-full overflow-y-scroll  scrollbar-hide overflow-scroll pb-28 md:mt-5 mt-5">
          <div className="">
            <div className="flex md:flex-row flex-col md:justify-between md:items-end gap-3">
              <input
                className="bg-gray-100 text-black border border-gray-100 outline-none h-[40px] md:w-[435px] w-full px-5 rounded-[10px] text-custom-darkBlack font-normal text-base"
                type="text"
                placeholder="Search Products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <button
                className="text-white bg-[#F38529] px-5 py-2.5 rounded cursor-pointer"
                onClick={() => router.push("/add-product")}
              >
                Add Product
              </button>
            </div>

            <Table
              columns={columns1}
              data={productsList}
              pagination={pagination}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              itemsPerPage={pagination.itemsPerPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default isAuth(Inventory);
