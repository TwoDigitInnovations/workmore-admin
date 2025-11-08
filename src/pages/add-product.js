import React, { useContext, useRef, useState, useEffect } from "react";
import { IoAddSharp, IoCloseCircleOutline } from "react-icons/io5";
import { IoIosClose } from "react-icons/io";
import { userContext } from "./_app";
import "react-color-palette/css";
import { Api, ApiFormData } from "../../services/service";
import { useRouter } from "next/router";
import { produce } from "immer";
import isAuth from "../../components/isAuth";
import Compressor from "compressorjs";

function AddProduct(props) {
  const router = useRouter();
  const [images, setImages] = useState([]); // ✅ store multiple image URLs
  const fileRef = useRef();

  const unitData = [
    { name: "Each", value: "each" },
    { name: "Piece", value: "piece" },
    { name: "Pack", value: "pack" },
    { name: "Case", value: "case" },
    { name: "Bag", value: "bag" },
  ];

  const [addProductsData, setAddProductsData] = useState({
    name: "",
    slug: "",
    image: [],
    category: [],
    relatedName: [],
    origin: "",
    metadescription: "",
    metatitle: "",
    imageAltName: "",
    Warning: "",
    Quantity: "",
    unit: "",
    other_price: "",
    our_price: "",
    expirydate: "",
    manufacturername: "",
    manufactureradd: "",
    description: "",
    price_slot: [
      {
        value: 0,
        price: 0,
      },
    ],
  });

  const [categoryData, setCategoryData] = useState([]);
  const [user, setUser] = useContext(userContext);
  const [relatedNames, setRelatedNames] = useState(""); // store as string

  const handleChange = (e) => {
    setRelatedNames(e.target.value);
  };

  useEffect(() => {
    getCategory();
  }, []);

  useEffect(() => {
    if (router?.query?.id) {
      getProductById();
    }
  }, []);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  const getProductById = async (id) => {
    props.loader(true);
    Api("get", `getProductById/${router?.query?.id}`, "", router).then(
      (res) => {
        props.loader(false);
        console.log("res================>", res);
        if (res?.status) {
          setAddProductsData({
            name: res?.data?.name,
            slug: res?.data?.slug,
            metatitle: res?.data?.metatitle,
            imageAltName: res?.data?.imageAltName,
            metadescription: res?.data?.metadescription,
            category: res?.data?.category?._id || "",
            categoryName: res?.data?.category?.name || "",
            description: res?.data?.description,
            Quantity: res?.data?.Quantity,
            price_slot: res?.data?.price_slot,
            ...res.data,
            manufacturername: res?.data?.manufacturername,
            expirydate: formatDate(res?.data?.expirydate),
            other_price: res?.data?.other_price,
            our_price: res?.data?.our_price,
            unit: res?.data?.price_slot[0]?.unit,
          });
          setRelatedNames(res?.data?.relatedName?.join(", "));
          setImages(res?.data?.image)
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        props.toaster({ type: "error", message: err?.message });
      }
    );
  };

  const getCategory = async () => {
    props.loader(true);
    Api("get", "getCategory", "", router).then(
      (res) => {
        props.loader(false);
        console.log("res================>", res);
        res.data.forEach((element, i) => {
          element.value = element._id;
          element.label = element.name;

          if (res.data.length === i + 1) {
            setCategoryData(res?.data);
            console.log("categorydata ::", res?.data);
          }
        });
      },
      (err) => {
        props.loader(false);
        console.log(err);
        props.toaster({ type: "error", message: err?.message });
      }
    );
  };

  console.log("rel", relatedNames)

  const createProduct = async (e) => {
    e.preventDefault();

    const array = relatedNames?.split(",")?.map((item) => item.trim()).filter((item) => item !== "");

    const data = {
      ...addProductsData,
      image: images,
      userid: user?._id,
      relatedName: array,

    };

    props.loader(true);
    Api("post", "createProduct", data, router).then(
      (res) => {
        props.loader(false);
        console.log("res================> careate Product :: ", res);
        if (res.status) {
          setAddProductsData({
            name: "",
            category: [],
            unit: "",
            our_price: "",
            other_price: "",
            manufacturername: "",
            description: "",
            price_slot: [
              {
                value: 0,
                price: 0,
              },
            ],
          });
          router.push("/inventory");
          props.toaster({ type: "success", message: res.data?.message });
        } else {
          props.toaster({ type: "error", message: res?.data?.message });
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        props.toaster({ type: "error", message: err?.message });
      }
    );
  };

  const updateProduct = async (e) => {
    e.preventDefault();

    const array = relatedNames?.split(",")?.map((item) => item.trim()).filter((item) => item !== "");

    const data = {
      ...addProductsData,
      userid: user?._id,
      relatedName: array,
      image: images,
      id: router?.query?.id,
    };

    console.log(data);
    console.log(addProductsData);

    props.loader(true);
    Api("post", "updateProduct", data, router).then(
      (res) => {
        props.loader(false);
        console.log("res================>", res);
        if (res.status) {
          setAddProductsData({
            name: "",
            category: [],
            unit: "",
            our_price: "",
            other_price: "",
            manufacturername: "",
            description: "",
            price_slot: [
              {
                value: 0,
                price: 0,
              },
            ],
          });
          router.push("/inventory");
          props.toaster({ type: "success", message: res.data?.message });
        } else {
          props.toaster({ type: "error", message: res?.data?.message });
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        props.toaster({ type: "error", message: err?.message });
      }
    );
  };


  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileSizeInMb = file.size / (1024 * 1024);
    if (fileSizeInMb > 1) {
      props.toaster({
        type: "error",
        message: "Too large file. Please upload a smaller image",
      });
      return;
    }

    // ✅ compress file
    new Compressor(file, {
      quality: 0.6,
      success: (compressedResult) => {
        const data = new FormData();
        data.append("file", compressedResult);
        props.loader(true);

        ApiFormData("post", "user/fileupload", data)
          .then((res) => {
            props.loader(false);
            if (res.status) {
              setImages((prev) => [...prev, res.data.file]); // ✅ add to array
              props.toaster({ type: "success", message: res.data.message });
            }
          })
          .catch((err) => {
            props.loader(false);
            props.toaster({ type: "error", message: err?.message });
          });
      },
    });
  };

  const handleDelete = (imgUrl) => {
    setImages((prev) => prev.filter((img) => img !== imgUrl));
  };


  const priceSlotsCloseIcon = (item, i) => {
    console.log(item, i);
    let data = addProductsData.price_slot;
    if (i > -1) {
      data.splice(i, 1);
    }
    console.log(data);
    setAddProductsData({ ...addProductsData, price_slot: data });
  };


  return (
    <section className="w-full h-full  bg-transparent pt-5 px-6">
      <div className="h-[90vh] overflow-y-scroll  scrollbar-hide overflow-scroll">
        <p className="text-black font-bold md:text-[32px] text-2xl ">
          <span
            className={`inline-block w-2 h-8 bg-custom-gray  mr-3 rounded `}
          ></span>
          Add Product
        </p>

        <form
          className="pb-14"
          onSubmit={router?.query?.id ? updateProduct : createProduct}
        >
          <div className=" md:pb-10 bg-transparent h-full w-full md:mt-5">
            {/* md:mt-9 pt-5*/}
            <div className=" pb-5 bg-white h-full w-full boxShadow">
              <div className="grid md:grid-cols-2 grid-cols-1 w-full gap-5">
                <div className="md:pt-0 pt-4">
                  <p className="text-black text-base font-normal pb-1">
                    Product Name
                  </p>
                  <div className="relative">
                    <input
                      className="bg-transparent w-full md:h-[46px] h-[40px] pl-12 pr-5 border border-newblack rounded-[10px] outline-none text-black text-base font-light"
                      type="text"
                      placeholder="Product Name"
                      value={addProductsData.name}
                      required
                      onChange={(e) => {
                        setAddProductsData({
                          ...addProductsData,
                          name: e.target.value,
                        });
                      }}
                    />
                    <img
                      className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                      src="/box-add.png"
                    />
                  </div>
                </div>

                <div className="">
                  <p className="text-black text-base font-normal pb-1">
                    Category
                  </p>

                  <div className="relative px-3 w-full bg-transparent border border-newblack rounded-[10px]">
                    <select
                      value={addProductsData.category?._id}
                      onChange={(newValue) => {
                        console.log(newValue);

                        const cat = categoryData.find(
                          (f) => f._id === newValue.target.value
                        );
                        setAddProductsData({
                          ...addProductsData,
                          category: newValue.target.value,
                          categoryName: cat.name,
                          attributes: cat.attributes,
                        });
                      }}
                      className="bg-transparent w-full md:h-[46px] h-[40px] pl-8 pr-5  outline-none text-black text-base font-light"
                      placeholder="Category"
                    >
                      <option value={""} className="p-5">
                        Category
                      </option>
                      {categoryData?.map((item, i) => (
                        <option key={i} value={item._id} className="p-5">
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <img
                      className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                      src="/box-add.png"
                    />
                  </div>
                </div>

                <div className="">
                  <p className="text-black text-base font-normal pb-1">
                    Manufacturer Name
                  </p>
                  <div className="relative">
                    <input
                      className="bg-transparent w-full md:h-[46px] h-[40px] pl-12 pr-5 border border-newblack rounded-[10px] outline-none text-black text-base font-light"
                      type="text"
                      placeholder="Manufacturer Name"
                      value={addProductsData.manufacturername}
                      onChange={(e) => {
                        setAddProductsData({
                          ...addProductsData,
                          manufacturername: e.target.value,
                        });
                      }}
                    />
                    <img
                      className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                      src="/box-add.png"
                    />
                  </div>
                </div>

                <div className="">
                  <p className="text-black text-base font-normal pb-1">
                    Quantity
                  </p>
                  <div className="relative">
                    <input
                      className="bg-transparent w-full md:h-[46px] h-[40px] pl-12 pr-5 border border-newblack rounded-[10px] outline-none text-black text-base font-light"
                      type="number"
                      min={0}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e") e.preventDefault(); // Block negative & exponent
                      }}
                      placeholder="Quantity"
                      value={addProductsData.Quantity}
                      onChange={(e) => {
                        let value = Number(e.target.value);
                        if (isNaN(value) || value < 0) value = 0;
                        setAddProductsData({
                          ...addProductsData,
                          Quantity: value,
                        });
                      }}
                    />
                    <img
                      className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                      src="/box-add.png"
                      alt="icon"
                    />
                  </div>
                </div>

              </div>


              <div className="pt-5">
                <p className="text-black text-base font-normal pb-1">
                  Related Names (Write Related Names separated by commas like this: Name, Name, Name)
                </p>
                <div className="relative">
                  <input
                    type="text"
                    className="bg-transparent w-full pl-12 pr-5 py-2 border border-newblack rounded-[10px] outline-none text-black text-base font-light"
                    placeholder="Enter names separated by commas"
                    value={relatedNames}
                    onChange={handleChange}
                  />

                  <img
                    className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                    src="/box-add.png"
                  />
                </div>
              </div>


              <div className="pt-5">
                <p className="text-black text-base font-normal pb-1">
                  Description
                </p>
                <div className="relative">
                  <textarea
                    className="bg-transparent w-full pl-12 pr-5 py-2 border border-newblack rounded-[10px] outline-none text-black text-base font-light"
                    rows={4}
                    placeholder="Long Description"
                    value={addProductsData.description}
                    onChange={(e) =>
                      setAddProductsData({
                        ...addProductsData,
                        description: e.target.value,
                      })
                    }
                  />
                  <img
                    className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                    src="/box-add.png"
                  />
                </div>
              </div>

              <div className="pt-5">
                <p className="text-black text-base font-normal pb-1">Meta Title</p>
                <div className="relative">
                  <textarea
                    className="bg-transparent w-full pl-12 pr-5 py-2 border border-newblack rounded-[10px] outline-none text-black text-base font-light"
                    rows={2}
                    placeholder="Meta Title (character length: 50–65)"
                    value={addProductsData.metatitle}
                    maxLength={65} // max limit
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 65) {
                        setAddProductsData({
                          ...addProductsData,
                          metatitle: value,
                        });
                      }
                    }}
                  />
                  <img
                    className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                    src="/box-add.png"
                  />
                  {/* Counter */}
                  <p className="text-xs text-gray-500 absolute right-3 bottom-[-20px]">
                    {addProductsData?.metatitle?.length}/65
                    {addProductsData?.metatitle?.length < 50 && " (min 50 required)"}
                  </p>
                </div>
              </div>

              <div className="pt-5">
                <p className="text-black text-base font-normal pb-1">Meta Description</p>
                <div className="relative">
                  <textarea
                    className="bg-transparent w-full pl-12 pr-5 py-2 border border-newblack rounded-[10px] outline-none text-black text-base font-light"
                    rows={4}
                    placeholder="Meta Description (character length: 150–160)"
                    value={addProductsData?.metadescription}
                    maxLength={160} // max limit
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 160) {
                        setAddProductsData({
                          ...addProductsData,
                          metadescription: value,
                        });
                      }
                    }}
                  />
                  <img
                    className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                    src="/box-add.png"
                  />
                  {/* Counter */}
                  <p className="text-xs text-gray-500 absolute right-3 bottom-[-20px]">
                    {addProductsData?.metadescription?.length}/160
                    {addProductsData?.metadescription?.length < 150 && " (min 150 required)"}
                  </p>
                </div>
              </div>


              <div className="pt-5">
                <p className="text-black text-base font-normal pb-1">
                  Slug <span className="text-gray-500 text-sm">(Only text allowed, numbers and special characters are not permitted)</span>
                </p>

                <div className="relative">
                  <textarea
                    className="bg-transparent w-full pl-12 pr-5 py-2 border border-newblack rounded-[10px] outline-none text-black text-base font-light"
                    rows={2}
                    placeholder="slug"
                    value={addProductsData.slug}
                    onChange={(e) =>
                      setAddProductsData({
                        ...addProductsData,
                        slug: e.target.value,
                      })
                    }
                  />
                  <img
                    className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                    src="/box-add.png"
                  />
                </div>
              </div>
              <div className="w-full">
                <div className="pt-5">
                  <p className="text-black text-base font-normal pb-1">
                    Image Alt Name
                  </p>
                  <div className="relative">
                    <textarea
                      className="bg-transparent w-full pl-12 pr-5 py-2 border border-newblack rounded-[10px] outline-none text-black text-base font-light"
                      rows={2}
                      placeholder="image Alt Name"
                      value={addProductsData.imageAltName}
                      onChange={(e) =>
                        setAddProductsData({
                          ...addProductsData,
                          imageAltName: e.target.value,
                        })
                      }
                    />
                    <img
                      className="w-[18px] h-[18px] absolute md:top-[13px] top-[10px] left-5"
                      src="/box-add.png"
                    />
                  </div>
                </div>
                <div className="w-full p-5 rounded-[10px] border border-gray-300 bg-white">
                  <p className="text-2xl font-medium text-black pt-3">Upload Image</p>

                  {/* Upload Button */}
                  <div className="flex items-center mt-5">
                    <div className="relative">
                      <div className="border-2 border-dashed border-black h-[38px] w-[38px] rounded-[5px] flex justify-center items-center bg-white cursor-pointer">
                        <IoAddSharp
                          className="text-black w-[20px] h-[20px]"
                          onClick={() => fileRef.current.click()}
                        />
                      </div>
                      <input
                        type="file"
                        ref={fileRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                    <p className="text-black text-base font-normal ml-5">Upload Photo</p>
                  </div>

                  {/* Image Preview */}
                  <div className="flex flex-wrap gap-4 mt-5">
                    {images.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img}
                          alt={`uploaded-${index}`}
                          className="w-[90px] h-[90px] object-contain border rounded-lg"
                        />
                        <IoCloseCircleOutline
                          className="text-red-600 cursor-pointer h-5 w-5 absolute left-1 top-1 bg-white rounded-full"
                          onClick={() => handleDelete(img)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="py-8 px-2">
                <h2 className="text-3xl font-semibold text-gray-800 mb-6">
                  Pricing
                </h2>

                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
                  <div className="grid md:grid-cols-4 grid-cols-1 gap-4">
                    {addProductsData?.price_slot?.map((slot, d) => (
                      <div
                        key={d}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 transition-all hover:shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-medium text-gray-800">
                            Slot {d + 1}
                          </h3>
                          <button
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            onClick={() => {
                              priceSlotsCloseIcon(slot, d);
                            }}
                          >
                            <IoIosClose className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                              Qty
                            </label>
                            <input
                              className="w-full bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-[#F38529]/30 focus:border-[#F38529] transition-colors"
                              type="text"
                              value={slot.value}
                              onChange={(e) => {
                                const input = e.target.value;

                                // Allow empty value for live typing
                                if (input === "") {
                                  slot.value = input;
                                  setAddProductsData({ ...addProductsData });
                                  return;
                                }

                                const value = Number(input);

                                if (!isNaN(value) && value >= 0) {
                                  slot.value = value;
                                  setAddProductsData({ ...addProductsData });
                                }
                              }}
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                              Unit
                            </label>
                            <select
                              className="w-full bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38529]/30 focus:border-[#F38529] transition-colors text-black"
                              name="unit"
                              value={slot.unit}
                              required
                              onChange={(e) => {
                                slot.unit = e.target.value;
                                setAddProductsData({ ...addProductsData });
                              }}
                            >
                              <option value="">Select Unit</option>
                              {unitData.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                              Offer Price
                            </label>
                            <input
                              className="w-full bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38529]/30 focus:border-[#F38529] transition-colors text-black"
                              type="number"
                              value={slot.our_price}
                              onChange={(e) => {
                                const input = e.target.value;

                                if (input === "") {
                                  slot.our_price = input;
                                  setAddProductsData({ ...addProductsData });
                                  return;
                                }

                                const value = Number(input);
                                if (!isNaN(value) && value >= 0) {
                                  slot.our_price = value;
                                  setAddProductsData({ ...addProductsData });
                                }
                              }}
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                              Price
                            </label>
                            <input
                              className="w-full bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38529]/30 focus:border-[#F38529] transition-colors text-black"
                              type="number"
                              value={slot.other_price}
                              onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e")
                                  e.preventDefault();
                              }}
                              onChange={(e) => {
                                const input = e.target.value;

                                if (input === "") {
                                  slot.other_price = input;
                                  setAddProductsData({ ...addProductsData });
                                  return;
                                }

                                const value = Number(input);
                                if (!isNaN(value) && value >= 0) {
                                  slot.other_price = value;
                                  setAddProductsData({ ...addProductsData });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="bg-custom-gray cursor-pointer text-white md:text-lg text-base  px-8 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                      onClick={() => {
                        setAddProductsData({
                          ...addProductsData,
                          price_slot: [
                            ...addProductsData.price_slot,
                            {
                              value: 0,
                              price: 0,
                            },
                          ],
                        });
                      }}
                    >
                      Add more
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-row flex-col justify-between items-center w-full pt-20 md:gap-0 gap-5">
                <div className="relative flex justify-center items-center md:w-auto w-full"></div>
                <div className="relative flex justify-center items-center md:w-auto w-full">
                  <button
                    className="bg-custom-gray px-8 py-2 rounded-[5px] md:text-lg text-base text-white font-normal cursor-pointer flex justify-center items-center gap-2"
                    type="submit"
                  >
                    {router?.query?.id ? "Update" : "Submit"}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

export default isAuth(AddProduct);
